// lib/db.ts
import './trust-system-ca';
import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;
// Vercel functions cannot keep a WebSocket pool; send queries over HTTP fetch.
if (process.env.VERCEL) {
  neonConfig.poolQueryViaFetch = true;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Get connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

// PrismaNeon takes a neon PoolConfig and owns the pool itself. Handing it an
// already-constructed Pool silently yields an adapter with no connection
// string, which then falls back to libpq defaults (localhost).
const adapter = new PrismaNeon({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
});

// Initialize Prisma Client WITH ADAPTER
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,  // <-- Pass adapter here instead of url in schema
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
