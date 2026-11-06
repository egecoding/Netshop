import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// import.meta.env is only populated when this module is bundled through Vite (i.e. the Astro
// app itself); guard the access so plain Node scripts like prisma/seed.ts can import this too.
if (import.meta.env?.DEV) {
  globalForPrisma.prisma = prisma;
}
