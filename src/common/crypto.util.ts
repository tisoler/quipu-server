import * as crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function deriveKey(masterKey: string): Buffer {
  return crypto.createHash('sha256').update(masterKey).digest();
}

/**
 * Cifra un secreto (clave privada ARCA) con AES-256-GCM usando la clave maestra
 * del entorno. Devuelve "v1.<iv>.<authTag>.<ciphertext>" en base64.
 */
export function encryptSecret(plaintext: string, masterKey: string): string {
  const key = deriveKey(masterKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decryptSecret(payload: string, masterKey: string): string {
  const [version, ivB64, authTagB64, dataB64] = payload.split('.');
  if (version !== 'v1') throw new Error('Formato de secreto cifrado no soportado');
  const key = deriveKey(masterKey);
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}
