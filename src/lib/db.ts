import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

let _prisma: PrismaClient;

export function getPrisma(): PrismaClient {
  if (!_prisma) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (url) {
      const libsql = createClient({ url, authToken });
      const adapter = new PrismaLibSQL(libsql);
      _prisma = new PrismaClient({ adapter });
    } else {
      _prisma = new PrismaClient();
    }
  }
  return _prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as any)[prop];
  },
});
