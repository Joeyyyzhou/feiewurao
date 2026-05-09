/**
 * AES-256-GCM encryption/decryption for sensitive data (wechat_id)
 * Key is stored in ENCRYPTION_KEY env var (32-byte hex string)
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY env var not set');
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt plaintext → base64 string (iv:ciphertext:tag)
 */
export function encrypt(plaintext) {
  if (!plaintext) return '';
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: base64(iv + ciphertext + tag)
  const combined = Buffer.concat([iv, encrypted, tag]);
  return combined.toString('base64');
}

/**
 * Decrypt base64 string → plaintext
 */
export function decrypt(encryptedBase64) {
  if (!encryptedBase64) return '';
  // If it doesn't look like base64 (legacy plaintext), return as-is
  if (!encryptedBase64.includes('=') && !encryptedBase64.match(/^[A-Za-z0-9+/]/)) {
    return encryptedBase64;
  }
  try {
    const key = getKey();
    const combined = Buffer.from(encryptedBase64, 'base64');
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(combined.length - TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    // If decryption fails, it's probably legacy plaintext
    return encryptedBase64;
  }
}

/**
 * Mask wechat_id for display: "Joeyzhouu" → "J*****u"
 */
export function mask(wechatId) {
  if (!wechatId || wechatId.length <= 2) return '***';
  return wechatId[0] + '*'.repeat(Math.max(3, wechatId.length - 2)) + wechatId[wechatId.length - 1];
}
