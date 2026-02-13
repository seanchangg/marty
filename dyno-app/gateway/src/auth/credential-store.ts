/**
 * Encrypted credential storage per user — for third-party API keys/tokens.
 *
 * Uses AES-256-GCM (same pattern as KeyStore) but stores in Supabase
 * instead of a flat JSON file, supporting multi-key per user.
 *
 * Defense-in-depth: uses a different scrypt salt than KeyStore.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// ── Constants ────────────────────────────────────────────────────────────────

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const MAX_CREDENTIALS_PER_USER = 20;

// ── CredentialStore ──────────────────────────────────────────────────────────

export class CredentialStore {
  private encryptionKey: Buffer;
  private supabaseUrl: string;
  private serviceRoleKey: string;

  constructor(secret: string) {
    this.encryptionKey = scryptSync(secret, "dyno-credential-store-salt", KEY_LENGTH);
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  }

  /** Store (or update) a credential for a user. */
  async store(userId: string, name: string, value: string): Promise<void> {
    // Check credential count limit
    const existing = await this.list(userId);
    const alreadyExists = existing.some((c) => c.credential_name === name);
    if (!alreadyExists && existing.length >= MAX_CREDENTIALS_PER_USER) {
      throw new Error(`Maximum ${MAX_CREDENTIALS_PER_USER} credentials per user`);
    }

    const encrypted = this.encrypt(value);

    if (alreadyExists) {
      // Update existing credential
      const qs = `user_id=eq.${userId}&credential_name=eq.${name}`;
      await this.supabaseRequest(
        `/rest/v1/user_credentials?${qs}`,
        "PATCH",
        { encrypted_value: encrypted, updated_at: new Date().toISOString() },
      );
    } else {
      // Insert new credential
      await this.supabaseRequest("/rest/v1/user_credentials", "POST", {
        user_id: userId,
        credential_name: name,
        encrypted_value: encrypted,
      });
    }
  }

  /** Retrieve and decrypt a credential value. */
  async retrieve(userId: string, name: string): Promise<string | null> {
    const qs = `user_id=eq.${userId}&credential_name=eq.${name}&select=encrypted_value`;
    const rows = await this.supabaseRequest(`/rest/v1/user_credentials?${qs}`, "GET");
    if (!rows || rows.length === 0) return null;

    try {
      return this.decrypt(rows[0].encrypted_value);
    } catch {
      return null;
    }
  }

  /** List credential names + timestamps for a user (never returns values). */
  async list(userId: string): Promise<Array<{ credential_name: string; created_at: string; updated_at: string }>> {
    const qs = `user_id=eq.${userId}&select=credential_name,created_at,updated_at&order=credential_name.asc`;
    const rows = await this.supabaseRequest(`/rest/v1/user_credentials?${qs}`, "GET");
    return rows || [];
  }

  /** Remove a credential. */
  async remove(userId: string, name: string): Promise<boolean> {
    const qs = `user_id=eq.${userId}&credential_name=eq.${name}`;
    const rows = await this.supabaseRequest(
      `/rest/v1/user_credentials?${qs}`,
      "DELETE",
    );
    return Array.isArray(rows) && rows.length > 0;
  }

  // ── Encryption ──────────────────────────────────────────────────────────

  private encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv);
    let encrypted = cipher.update(plaintext, "utf-8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
  }

  private decrypt(encrypted: string): string {
    const [ivHex, tagHex, ciphertext] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ciphertext, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
  }

  // ── Supabase HTTP ───────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async supabaseRequest(path: string, method: string, body?: unknown): Promise<any[]> {
    const headers: Record<string, string> = {
      apikey: this.serviceRoleKey,
      Authorization: `Bearer ${this.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=representation" : method === "DELETE" ? "return=representation" : "return=representation",
    };

    const url = `${this.supabaseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase ${method} ${path} failed (${res.status}): ${errText}`);
    }

    const text = await res.text();
    if (!text) return [];
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  }
}
