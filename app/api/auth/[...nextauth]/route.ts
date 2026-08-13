import NextAuth from 'next-auth';
import { ensureAuthUrl } from '@/lib/auth-env';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

ensureAuthUrl();

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
