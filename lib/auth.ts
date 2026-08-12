import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

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
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role?: string; vendorStatus?: string };
        token.role = u.role ?? 'CUSTOMER';
        if (u.vendorStatus) token.vendorStatus = u.vendorStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = (token.role as string) ?? 'CUSTOMER';
        if (token.vendorStatus) {
          session.user.vendorStatus = token.vendorStatus as string;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
