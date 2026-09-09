import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { renderScene } from '$lib/server/render';
import { beautifyOptionsSchema } from '$lib/core/options';

const MAX_BODY = 28 * 1024 * 1024;

export const POST: RequestHandler = async ({ request }) => {
  try {
    const length = Number(request.headers.get('content-length') ?? 0);
    if (length > MAX_BODY) return json({ error: 'Image is too large' }, { status: 413 });
    const body = await request.json() as Record<string, unknown>;
    const imageDataUrl = String(body.imageDataUrl ?? '');
    const options = beautifyOptionsSchema.parse(body.options ?? {});
    const buffer = await renderScene({
      imageDataUrl,
      sourceWidth: Number(body.sourceWidth) || undefined,
      sourceHeight: Number(body.sourceHeight) || undefined,
      options
    });
    return new Response(new Uint8Array(buffer), {
      headers: {
        'content-type': options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        'content-disposition': `attachment; filename="devshot.${options.format === 'jpeg' ? 'jpg' : 'png'}"`,
        'cache-control': 'no-store'
      }
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
};
