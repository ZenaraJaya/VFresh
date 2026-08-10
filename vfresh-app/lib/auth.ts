import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  session: {
    // No database sessions: the Admin model has no session table, and JWTs
    // keep the admin API routes cheap to authorise.
    strategy: 'jwt',
  },
  pages: {
    signIn: '/admin/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Admin credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!admin) return null;

        const ok = await bcrypt.compare(credentials.password, admin.password);
        if (!ok) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name ?? admin.email,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on the sign-in pass; persist the role onto the token.
      if (user) token.role = (user as { role?: string }).role ?? 'ADMIN';
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = (token.role as string) ?? 'ADMIN';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
