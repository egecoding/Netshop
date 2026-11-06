const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class UploadValidationError extends Error {}

export async function saveProductImage(_file: File): Promise<string> {
  throw new UploadValidationError(
    'Image uploads are not supported in serverless mode. Add images to public/product-images/ and redeploy.'
  );
}

export async function deleteProductImage(_url: string): Promise<void> {
  // no-op in serverless mode
}

export function sanitizeFilename(name: string): string | null {
  if (!/^[a-zA-Z0-9-]+\.(jpg|png|webp)$/.test(name)) return null;
  return name;
}
