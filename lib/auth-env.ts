import { createHash } from 'node:crypto';

/**
 * Read env at runtime. Names are assembled so Next cannot replace them with
 * empty strings during `next build` when the var is only set on the server.
 */
function runtimeEnv(parts: string[]) {
  const env = process.env as Record<string, string | undefined>;
  return env[parts.join('')];
}

function derivedSecret() {
  const material =
    runtimeEnv(['DATABASE', '_URL']) ||
    runtimeEnv(['POSTGRES', '_URL']) ||
    runtimeEnv(['VERCEL', '_URL']);
  if (!material) return undefined;
  return createHash('sha256').update(`vfresh-nextauth:${material}`).digest('hex');
}

export function authSecret() {
  return (
    runtimeEnv(['NEXTAUTH', '_SECRET']) ||
    runtimeEnv(['AUTH', '_SECRET']) ||
    derivedSecret()
  );
}

export function ensureAuthUrl() {
  const env = process.env as Record<string, string | undefined>;
  const secret = authSecret();
  if (secret && !env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = secret;
  }

  if (runtimeEnv(['NEXTAUTH', '_URL'])) return;

  const host =
    runtimeEnv(['VERCEL_PROJECT_PRODUCTION', '_URL']) ||
    runtimeEnv(['VERCEL', '_URL']);
  if (host) {
    process.env.NEXTAUTH_URL = host.startsWith('http')
      ? host
      : `https://${host}`;
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  }
}
