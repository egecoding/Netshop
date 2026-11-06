import type { APIRoute } from 'astro';
import { sanitizeFilename, getR2Bucket } from '../../lib/uploads';

export const GET: APIRoute = async ({ params }) => {
  const filename = sanitizeFilename(params.filename ?? '');
  if (!filename) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const object = await getR2Bucket().get(`products/${filename}`);
    if (!object) {
      return new Response('Not found', { status: 404 });
    }
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
