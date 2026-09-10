import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { captureWebsite } from '$lib/server/capture';

const captureSchema = z.object({
  url: z.string().url().max(2048),
  viewport: z.enum(['desktop', 'mobile']).default('desktop')
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const input = captureSchema.parse(await request.json());
    const capture = await captureWebsite(input.url, input.viewport);
    return json({
      imageDataUrl: `data:image/png;base64,${capture.buffer.toString('base64')}`,
      sourceWidth: capture.width,
      sourceHeight: capture.height,
      finalUrl: capture.finalUrl
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
};
