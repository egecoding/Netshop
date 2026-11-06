import { defineConfig } from 'prisma/config';

try {
  process.loadEnvFile('.env');
} catch {
  // .env is optional when the environment already provides DATABASE_URL (e.g. CI / Cloudflare build).
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
