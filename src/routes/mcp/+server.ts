import type { RequestHandler } from './$types';
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { renderScene } from '$lib/server/render';
import { beautifyOptionsSchema } from '$lib/core/options';

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'beautify_screenshot',
      {
        title: 'Beautify screenshot',
        description: 'Wrap a PNG, JPEG or WebP screenshot in an opinionated DevShot frame and return the finished image. Uses deterministic HTML-in-Canvas rendering. No AI and no account.',
        inputSchema: {
          image_base64: z.string().min(16).describe('Raw base64 screenshot bytes, without a data URL prefix.'),
          mime_type: z.enum(['image/png', 'image/jpeg', 'image/webp']).default('image/png'),
          background: beautifyOptionsSchema.shape.background,
          aspect_ratio: beautifyOptionsSchema.shape.aspectRatio,
          fit: beautifyOptionsSchema.shape.fit,
          padding: beautifyOptionsSchema.shape.padding,
          radius: beautifyOptionsSchema.shape.radius,
          shadow: beautifyOptionsSchema.shape.shadow,
          width: beautifyOptionsSchema.shape.width,
          format: beautifyOptionsSchema.shape.format,
          quality: beautifyOptionsSchema.shape.quality
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
      },
      async (input) => {
        const bytes = Buffer.from(input.image_base64, 'base64');
        if (!bytes.length || bytes.length > 20 * 1024 * 1024) throw new Error('Screenshot must be between 1 byte and 20 MB');
        const options = beautifyOptionsSchema.parse({
          background: input.background,
          aspectRatio: input.aspect_ratio,
          fit: input.fit,
          padding: input.padding,
          radius: input.radius,
          shadow: input.shadow,
          width: input.width,
          format: input.format,
          quality: input.quality
        });
        const rendered = await renderScene({ imageDataUrl: `data:${input.mime_type};base64,${bytes.toString('base64')}`, options });
        return {
          content: [
            { type: 'image' as const, data: rendered.toString('base64'), mimeType: options.format === 'jpeg' ? 'image/jpeg' : 'image/png' },
            { type: 'text' as const, text: `Done. ${options.width}px ${options.aspectRatio} DevShot with ${options.background} background.` }
          ]
        };
      }
    );
  },
  { serverInfo: { name: 'DevShot', version: '0.1.0' } },
  { maxDuration: 60, streamableHttpEndpoint: '/mcp', disableSse: true }
);

export const POST: RequestHandler = async ({ request }) => (await handler(request)) ?? new Response(null, { status: 200 });
export const GET: RequestHandler = async ({ request, url }) => {
  if ((request.headers.get('accept') ?? '').includes('text/html')) return new Response(null, { status: 303, headers: { location: `${url.origin}/#mcp` } });
  return Response.json({ name: 'DevShot', transport: 'streamable-http', endpoint: `${url.origin}/mcp`, authentication: 'none', tool: 'beautify_screenshot' });
};
export const DELETE: RequestHandler = async ({ request }) => (await handler(request)) ?? new Response(null, { status: 200 });
