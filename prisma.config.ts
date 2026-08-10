// prisma.config.ts
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer auto-loads .env — the CLI needs it for DIRECT_URL below.
// (Next.js loads .env on its own, so this only affects prisma CLI commands.)
try {
  process.loadEnvFile('.env');
} catch {
  // no .env present — rely on the ambient environment
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Required by db push / migrate / introspect — the schema's datasource block
  // has no url because the runtime client gets it from the Neon adapter.
  //
  // Use process.env directly, not Prisma's env() helper: env() throws at
  // config-load time when the var is unresolved, which breaks `prisma
  // generate` (run from postinstall on every `npm install`, including on
  // Vercel before DIRECT_URL may be configured) even though generate never
  // needs a live connection. Only db push/migrate actually need this value.
  datasource: {
    url: process.env.DIRECT_URL,
  },
  migrations: {
    path: 'prisma/migrations',
  },
});