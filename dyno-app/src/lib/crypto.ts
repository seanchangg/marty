const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, { name: ALGORITHM }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptApiKey(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptApiKey(
  base64Ciphertext: string,
  key: CryptoKey
): Promise<string> {
  const combined = Uint8Array.from(atob(base64Ciphertext), (c) =>
    c.charCodeAt(0)
  );
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

/**
 * Decrypt the API key using the private key from localStorage
 * and the ciphertext from the user profile.
 * Returns null if either piece is missing or decryption fails.
 */
export async function getDecryptedApiKey(
  encryptedApiKey: string | null | undefined
): Promise<string | null> {
  const privateKeyB64 =
    typeof window !== "undefined"
      ? localStorage.getItem("dyno_encryption_key")
      : null;

  if (!privateKeyB64 || !encryptedApiKey) return null;

  try {
    const key = await importKey(privateKeyB64);
    return await decryptApiKey(encryptedApiKey, key);
  } catch {
    return null;
  }
}
