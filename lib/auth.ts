import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { authSecret, ensureAuthUrl } from '@/lib/auth-env';
import { findCourierByEmail, findCourierById } from '@/lib/courier-lookup';
import { credentialValue } from '@/lib/demo-accounts';
import { verifyStoredOrDemoPassword } from '@/lib/demo-password';
import { ensurePublishedDemoCustomer } from '@/lib/ensure-demo-customer';
import { SESSION_IDLE_SECONDS } from '@/lib/session-idle';

ensureAuthUrl();

function unixNow() {
  return Math.floor(Date.now() / 1000);
}

export const authOptions: NextAuthOptions = {
  secret: authSecret(),
  session: {
    strategy: 'jwt',
    maxAge: SESSION_IDLE_SECONDS,
    updateAge: SESSION_IDLE_SECONDS,
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

        const email = credentialValue(credentials.email).toLowerCase();
        const password = credentialValue(credentials.password);

        if (!email || !password) return null;

        const demoCustomer = await ensurePublishedDemoCustomer(email, password);
        if (demoCustomer) {
          return {
            id: demoCustomer.id,
            email: demoCustomer.email,
            name: demoCustomer.name ?? demoCustomer.email,
            role: 'CUSTOMER',
            companyId: demoCustomer.companyId ?? undefined,
          };
        }

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (admin) {
          const ok = await verifyStoredOrDemoPassword(
            email,
            password,
            admin.password,
            (password) =>
              prisma.admin.update({ where: { id: admin.id }, data: { password } })
          );
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
          const ok = await verifyStoredOrDemoPassword(
            email,
            password,
            vendor.password,
            (password) =>
              prisma.vendor.update({ where: { id: vendor.id }, data: { password } })
          );
          if (!ok) return null;
          return {
            id: vendor.id,
            email: vendor.email,
            name: vendor.businessName,
            role: 'VENDOR',
            vendorStatus: vendor.status,
          };
        }

        const courier = await findCourierByEmail(email);
        if (courier) {
          const ok = await verifyStoredOrDemoPassword(
            email,
            password,
            courier.password,
            (password) =>
              prisma.courier.update({
                where: { id: courier.id },
                data: { password },
              })
          );
          if (!ok) return null;
          return {
            id: courier.id,
            email: courier.email,
            name: courier.name,
            role: 'DELIVERY',
          };
        }

        const customer = await prisma.customer.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            companyId: true,
          },
        });
        if (!customer) return null;

        const ok = await verifyStoredOrDemoPassword(
          email,
          password,
          customer.password,
          (password) =>
            prisma.customer.update({
              where: { id: customer.id },
              data: { password },
            })
        );
        if (!ok) return null;

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name ?? customer.email,
          role: 'CUSTOMER',
          companyId: customer.companyId ?? undefined,
        };
        } catch (error) {
          console.error('Sign-in failed', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const now = unixNow();

      if (user) {
        const u = user as {
          role?: string;
          vendorStatus?: string;
          companyId?: string;
        };
        if (u.role) token.role = u.role;
        token.vendorStatus = u.vendorStatus;
        token.companyId = u.companyId;
        token.lastActivity = now;
        token.idleExpired = false;
      } else if (trigger === 'update') {
        token.lastActivity = now;
        token.idleExpired = false;
      } else if (
        typeof token.lastActivity === 'number' &&
        now - token.lastActivity > SESSION_IDLE_SECONDS
      ) {
        token.idleExpired = true;
      } else if (typeof token.lastActivity !== 'number') {
        token.lastActivity = now;
      }

      if (
        trigger === 'update' &&
        session
      ) {
        const next = session as { name?: string; companyId?: string };
        if (typeof next.name === 'string' && next.name.trim()) {
          token.name = next.name.trim();
        }
        if (typeof next.companyId === 'string' && next.companyId) {
          token.companyId = next.companyId;
        }
      }

      // Refresh rider profile only for rider sessions. Looking up every
      // token.sub in `couriers` was flipping shoppers onto /delivery.
      if (token.idleExpired) {
        return token;
      }

      if (token.role === 'DELIVERY' && token.sub) {
        try {
          const courier = await findCourierById(token.sub);
          if (courier) {
            if (courier.name) token.name = courier.name;
            token.email = courier.email;
          }
        } catch {
          // Keep the JWT if courier lookup fails.
        }
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

      if (token.role === 'CUSTOMER' && token.sub) {
        try {
          const customer = await prisma.customer.findUnique({
            where: { id: token.sub },
            select: { companyId: true, name: true },
          });
          if (customer) {
            token.companyId = customer.companyId ?? undefined;
            if (customer.name) token.name = customer.name;
          }
        } catch {
          // Stale Prisma clients after a schema change can fail here; keep the JWT.
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.idleExpired) {
        session.idleExpired = true;
        session.expires = new Date(0).toISOString();
        return session;
      }
      if (typeof token.lastActivity === 'number') {
        session.lastActivity = token.lastActivity;
      }
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = (token.role as string) ?? 'CUSTOMER';
        session.user.vendorStatus = token.vendorStatus as string | undefined;
        session.user.companyId = token.companyId;
      }
      return session;
    },
  },
};
