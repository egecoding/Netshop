/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  PRODUCT_IMAGES: R2Bucket;
}

declare namespace App {
  interface Locals extends Runtime {
    user: import('@prisma/client').User | null;
    sessionId: string | null;
  }
}
