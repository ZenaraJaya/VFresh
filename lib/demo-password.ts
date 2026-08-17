import bcrypt from 'bcryptjs';
import { isPublishedDemoPassword } from '@/lib/demo-accounts';

/** Accept the stored hash, or the published demo password if the hash has drifted. */
export async function verifyStoredOrDemoPassword(
  email: string,
  password: string,
  storedHash: string | undefined,
  persistHash?: (nextHash: string) => Promise<unknown>
) {
  if (storedHash) {
    try {
      if (await bcrypt.compare(password, storedHash)) return true;
    } catch {
      // Stored value is not a bcrypt hash.
    }
  }

  if (!isPublishedDemoPassword(email, password)) return false;

  if (persistHash) {
    try {
      await persistHash(await bcrypt.hash(password, 10));
    } catch (error) {
      console.error('Demo password rehash failed', error);
    }
  }
  return true;
}
