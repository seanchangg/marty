/**
 * Supabase JWT verifier for Gateway WebSocket authentication.
 *
 * Uses the Supabase Auth API (auth.getUser) to validate tokens,
 * which works with both legacy JWT secrets and new signing keys.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface VerifyResult {
  valid: boolean;
  userId: string | null;
  email: string | null;
  error: string | null;
}

// ── SupabaseVerifier ─────────────────────────────────────────────────────────

export class SupabaseVerifier {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for JWT verification");
    }
    this.supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /**
   * Verify a Supabase JWT token via the Auth API.
   * Returns the userId if valid.
   */
  async verify(token: string): Promise<VerifyResult> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        return {
          valid: false,
          userId: null,
          email: null,
          error: error?.message || "No user returned",
        };
      }

      return {
        valid: true,
        userId: user.id,
        email: user.email || null,
        error: null,
      };
    } catch (err) {
      return {
        valid: false,
        userId: null,
        email: null,
        error: `Verification error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Extract token from WebSocket connection URL query params.
   * Expected format: ws://host:port?token=JWT_TOKEN
   */
  static extractTokenFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url, "http://localhost");
      return parsed.searchParams.get("token");
    } catch {
      return null;
    }
  }

  /**
   * Extract token from WebSocket upgrade headers.
   * Checks Authorization: Bearer TOKEN header.
   */
  static extractTokenFromHeaders(headers: Record<string, string>): string | null {
    const auth = headers["authorization"] || headers["Authorization"];
    if (auth && auth.startsWith("Bearer ")) {
      return auth.slice(7);
    }
    return null;
  }
}
