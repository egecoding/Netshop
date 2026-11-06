import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { sanitizeFilename, uploadsRoot } from '../../lib/uploads';

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const GET: APIRoute = async ({ params }) => {
  const filename = sanitizeFilename(params.filename ?? '');
  if (!filename) {
    return new Response('Not found', { status: 404 });
  }

  const ext = filename.split('.').pop()!;
  try {
    const data = await readFile(path.join(uploadsRoot(), filename));
    return new Response(data, {
      headers: {
        'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
