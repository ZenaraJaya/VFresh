import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { authSecret, ensureAuthUrl } from '@/lib/auth-env';

ensureAuthUrl();

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
        if (!credentials?.email || !credentials.password) return null;

        const email = credentials.email.toLowerCase().trim();

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (admin) {
          const ok = await bcrypt.compare(credentials.password, admin.password);
          if (!ok) return null;
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name ?? admin.email,
            role: 'ADMIN',
          };
        }

        const vendor = await prisma.vendor.findUnique({ where: { email } });
        if (vendor) {
          const ok = await bcrypt.compare(credentials.password, vendor.password);
          if (!ok) return null;
          return {
            id: vendor.id,
            email: vendor.email,
            name: vendor.businessName,
            role: 'VENDOR',
            vendorStatus: vendor.status,
          };
        }

        const customer = await prisma.customer.findUnique({ where: { email } });
        if (!customer) return null;

        const ok = await bcrypt.compare(credentials.password, customer.password);
        if (!ok) return null;

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name ?? customer.email,
          role: 'CUSTOMER',
        };
        } catch (error) {
          console.error('Sign-in failed', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role?: string; vendorStatus?: string };
        token.role = u.role ?? 'CUSTOMER';
        token.vendorStatus = u.vendorStatus;
      }

      // Keep vendor approval in sync so an approved kitchen is not stuck
      // on the pending screen after sign-in.
      if (token.role === 'VENDOR' && token.sub) {
        try {
          const vendor = await prisma.vendor.findUnique({
            where: { id: token.sub },
            select: { status: true },
          });
          if (vendor) token.vendorStatus = vendor.status;
        } catch (error) {
          console.error('Vendor session refresh failed', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = (token.role as string) ?? 'CUSTOMER';
        session.user.vendorStatus = token.vendorStatus as string | undefined;
      }
      return session;
    },
  },
  secret: authSecret(),
};
