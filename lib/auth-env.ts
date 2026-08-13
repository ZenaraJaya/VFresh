/**
 * Read auth env at runtime. Bracket access avoids Next inlining an empty
 * NEXTAUTH_SECRET at build time when the var is only present on the server.
 */
function readEnv(key: string) {
  return process.env[key];
}

export function ensureAuthUrl() {
  if (readEnv('NEXTAUTH_URL')) return;
  const host =
    readEnv('VERCEL_PROJECT_PRODUCTION_URL') || readEnv('VERCEL_URL');
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

export function authSecret() {
  const secret = readEnv('NEXTAUTH_SECRET') || readEnv('AUTH_SECRET');
  if (!secret && process.env.NODE_ENV === 'production') {
    console.error(
      'NextAuth secret is missing. Set NEXTAUTH_SECRET (or AUTH_SECRET) on Vercel.'
    );
  }
  return secret;
}
