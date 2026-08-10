// prisma.config.ts
import { defineConfig, env } from 'prisma/config';

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
  datasource: {
    url: env('DIRECT_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
  },
});