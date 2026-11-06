import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

export let prisma: PrismaClient;

export function initDb(d1: D1Database) {
  if (!prisma) {
    const adapter = new PrismaD1(d1);
    prisma = new PrismaClient({ adapter });
  }
}
