import { randomBytes } from 'crypto';
import { MIN_PASSWORD_LENGTH } from '@/lib/password-rules';

export { MIN_PASSWORD_LENGTH, isValidPassword } from '@/lib/password-rules';

/** Readable temporary password for emailed vendor access. */
export function generateTempPassword(length = Math.max(12, MIN_PASSWORD_LENGTH)) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}
