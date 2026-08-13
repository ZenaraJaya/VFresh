// lib/db.ts
import './trust-system-ca';
import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
if (process.env.VERCEL) {
  neonConfig.poolQueryViaFetch = true;
}

/** Bump when Customer/Order fields change so HMR drops a stale Prisma singleton. */
const PRISMA_CLIENT_REV = 3;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaRev?: number;
};

function neonConnectionString(raw: string) {
  try {
    const url = new URL(raw);
    url.searchParams.delete('channel_binding');
    return url.toString();
  } catch {
    return raw;
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaNeon({
  connectionString: neonConnectionString(connectionString),
  max: process.env.VERCEL ? 1 : 10,
  idleTimeoutMillis: 30_000,
});

function makePrisma() {
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

function customerFieldNames(client: PrismaClient): string[] {
  const model = (
    client as unknown as {
      _runtimeDataModel?: {
        models?: Record<string, { fields?: Array<{ name: string }> }>;
      };
    }
  )._runtimeDataModel?.models?.Customer;
  return model?.fields?.map((field) => field.name) ?? [];
}

function clientLooksCurrent(client: PrismaClient) {
  const fields = customerFieldNames(client);
  return (
    fields.includes('companyId') &&
    fields.includes('paymentMethod') &&
    typeof client.recurringOrder?.findMany === 'function'
  );
}

const cached = globalForPrisma.prisma;
const reuse =
  cached &&
  globalForPrisma.prismaRev === PRISMA_CLIENT_REV &&
  clientLooksCurrent(cached);

const prisma = reuse ? cached : makePrisma();

if (cached && cached !== prisma) {
  void cached.$disconnect();
}

export { prisma };

globalForPrisma.prisma = prisma;
globalForPrisma.prismaRev = PRISMA_CLIENT_REV;
