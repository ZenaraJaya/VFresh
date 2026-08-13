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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
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

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

globalForPrisma.prisma = prisma;
