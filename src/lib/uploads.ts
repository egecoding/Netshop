import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

// Local filesystem image storage. Files live outside `public/` and `dist/` in a persistent
// `uploads/` directory at the project root, served back out through the
// src/pages/product-images/[filename].ts endpoint rather than Astro's static file pipeline --
// that endpoint works identically in dev and in a production build, whereas writing into
// `public/` would only be reachable in dev (a production build serves a frozen snapshot of
// `public/` taken at build time, not the live directory).
//
// Caveat: this only works for a long-running single-instance server with a persistent disk.
// Most serverless/edge platforms (Vercel, Netlify Functions, etc.) wipe the filesystem between
// invocations or deploys, so uploaded files would vanish. For that kind of hosting, swap this
// module for a cloud object storage client (S3, Cloudflare R2, Supabase Storage, Cloudinary...)
// while keeping the same saveProductImage/deleteProductImage call sites.

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads', 'products');
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class UploadValidationError extends Error {}

export async function saveProductImage(file: File): Promise<string> {
  if (file.size === 0) {
    throw new UploadValidationError('Empty file');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadValidationError('Image must be 5MB or smaller');
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new UploadValidationError('Only JPEG, PNG, or WebP images are allowed');
  }

  await mkdir(UPLOADS_ROOT, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOADS_ROOT, filename), buffer);

  return `/product-images/${filename}`;
}

export async function deleteProductImage(url: string): Promise<void> {
  if (!url.startsWith('/product-images/')) return;
  const filename = sanitizeFilename(url.slice('/product-images/'.length));
  if (!filename) return;
  await unlink(path.join(UPLOADS_ROOT, filename)).catch(() => {});
}

// Only ever a bare "<uuid>.<ext>" with no path separators -- rejects any attempt at path
// traversal via the filename (both in the upload endpoint and here).
export function sanitizeFilename(name: string): string | null {
  if (!/^[a-zA-Z0-9-]+\.(jpg|png|webp)$/.test(name)) return null;
  return name;
}

export function uploadsRoot(): string {
  return UPLOADS_ROOT;
}
