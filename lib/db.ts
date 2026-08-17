import './trust-system-ca';
import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
if (process.env.VERCEL) {
  neonConfig.poolQueryViaFetch = true;
}

/** Bump when Prisma models change so HMR drops a stale Prisma singleton. */
const PRISMA_CLIENT_REV = 21;

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

const rawConnectionString: string | undefined = process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const connectionString: string = rawConnectionString;

function makePrisma() {
  const adapter = new PrismaNeon({
    connectionString: neonConnectionString(connectionString),
    max: process.env.VERCEL ? 1 : 10,
  });
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

function companyFieldNames(client: PrismaClient): string[] {
  const model = (
    client as unknown as {
      _runtimeDataModel?: {
        models?: Record<string, { fields?: Array<{ name: string }> }>;
      };
    }
  )._runtimeDataModel?.models?.Company;
  return model?.fields?.map((field) => field.name) ?? [];
}

function orderFieldNames(client: PrismaClient): string[] {
  const model = (
    client as unknown as {
      _runtimeDataModel?: {
        models?: Record<string, { fields?: Array<{ name: string }> }>;
      };
    }
  )._runtimeDataModel?.models?.Order;
  return model?.fields?.map((field) => field.name) ?? [];
}

function vendorFieldNames(client: PrismaClient): string[] {
  const model = (
    client as unknown as {
      _runtimeDataModel?: {
        models?: Record<string, { fields?: Array<{ name: string }> }>;
      };
    }
  )._runtimeDataModel?.models?.Vendor;
  return model?.fields?.map((field) => field.name) ?? [];
}

function menuItemFieldNames(client: PrismaClient): string[] {
  const model = (
    client as unknown as {
      _runtimeDataModel?: {
        models?: Record<string, { fields?: Array<{ name: string }> }>;
      };
    }
  )._runtimeDataModel?.models?.MenuItem;
  return model?.fields?.map((field) => field.name) ?? [];
}

function clientLooksCurrent(client: PrismaClient) {
  const fields = customerFieldNames(client);
  const companyFields = companyFieldNames(client);
  const orderFields = orderFieldNames(client);
  const vendorFields = vendorFieldNames(client);
  const menuFields = menuItemFieldNames(client);
  return (
    fields.includes('companyId') &&
    fields.includes('billingName') &&
    fields.includes('paymentMethod') &&
    fields.includes('companyRole') &&
    companyFields.includes('status') &&
    orderFields.includes('courierId') &&
    orderFields.includes('pickedUpAt') &&
    vendorFields.includes('warningCount') &&
    menuFields.includes('reviewStatus') &&
    typeof client.recurringOrder?.findMany === 'function' &&
    typeof client.companyInvite?.findMany === 'function' &&
    typeof client.courier?.findMany === 'function'
  );
}

const cached = globalForPrisma.prisma;
const reuse =
  cached &&
  globalForPrisma.prismaRev === PRISMA_CLIENT_REV &&
  clientLooksCurrent(cached);

const prisma = reuse ? cached : makePrisma();

export { prisma };

export function prismaHasMenuReviewStatus() {
  return menuItemFieldNames(prisma).includes('reviewStatus');
}

globalForPrisma.prisma = prisma;
globalForPrisma.prismaRev = PRISMA_CLIENT_REV;
