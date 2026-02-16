import { importKey, encryptApiKey, decryptApiKey } from "./crypto";

export const DEMO_ACCOUNT_EMAIL = "demo@marty.app";
export const DEMO_ACCOUNT_PASSWORD = "demo-hackathon-2026";

// A known plaintext/ciphertext pair for validating the demo code.
// Set DEMO_VALIDATION_CIPHER by running `generateDemoValidation(key)` once
// with the real key, then paste the result here.
const DEMO_VALIDATION_PLAINTEXT = "dyno-demo-valid";
export let DEMO_VALIDATION_CIPHER = "I93hJnkD91Ku7G4d1qs8P0v1lBcFNO7X1EQmfb76v1F0XLDIFi0BXUl7Lg==";

/**
 * One-time helper: encrypt the validation plaintext with the real key
 * and log the ciphertext. Paste it into DEMO_VALIDATION_CIPHER above.
 *
 * Usage (browser console):
 *   import { generateDemoValidation } from "@/lib/demo";
 *   generateDemoValidation("your-base64-key");
 */
export async function generateDemoValidation(base64Key: string) {
  const key = await importKey(base64Key);
  const cipher = await encryptApiKey(DEMO_VALIDATION_PLAINTEXT, key);
  console.log("DEMO_VALIDATION_CIPHER =", JSON.stringify(cipher));
  return cipher;
}

/**
 * Validate a demo code (encryption key) by attempting to decrypt
 * the known validation ciphertext. Returns true if the key is correct.
 */
export async function validateDemoCode(base64Key: string): Promise<boolean> {
  if (!DEMO_VALIDATION_CIPHER) {
    // If no validation cipher is set yet, skip validation
    return true;
  }
  try {
    const key = await importKey(base64Key);
    const result = await decryptApiKey(DEMO_VALIDATION_CIPHER, key);
    return result === DEMO_VALIDATION_PLAINTEXT;
  } catch {
    return false;
  }
}
