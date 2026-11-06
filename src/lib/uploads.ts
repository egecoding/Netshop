let _bucket: R2Bucket;

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class UploadValidationError extends Error {}

export function initR2(bucket: R2Bucket) {
  _bucket = bucket;
}

export function getR2Bucket(): R2Bucket {
  if (!_bucket) throw new Error('R2 bucket not initialized — call initR2 first');
  return _bucket;
}

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

  const filename = `${crypto.randomUUID()}.${ext}`;
  await getR2Bucket().put(`products/${filename}`, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return `/product-images/${filename}`;
}

export async function deleteProductImage(url: string): Promise<void> {
  if (!url.startsWith('/product-images/')) return;
  const filename = sanitizeFilename(url.slice('/product-images/'.length));
  if (!filename) return;
  await getR2Bucket().delete(`products/${filename}`).catch(() => {});
}

export function sanitizeFilename(name: string): string | null {
  if (!/^[a-zA-Z0-9-]+\.(jpg|png|webp)$/.test(name)) return null;
  return name;
}
