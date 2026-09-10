import type { RequestHandler } from './$types';
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { renderScene } from '$lib/server/render';
import { beautifyOptionsSchema } from '$lib/core/options';
import { getMcpUrl, getSiteUrl } from '$lib/config/site';
import { captureWebsite } from '$lib/server/capture';

const renderOptionShape = {
  background: beautifyOptionsSchema.shape.background,
  aspect_ratio: beautifyOptionsSchema.shape.aspectRatio,
  fit: beautifyOptionsSchema.shape.fit,
  padding: beautifyOptionsSchema.shape.padding,
  radius: beautifyOptionsSchema.shape.radius,
  shadow: beautifyOptionsSchema.shape.shadow,
  style: beautifyOptionsSchema.shape.style,
  look: beautifyOptionsSchema.shape.look,
  effect: beautifyOptionsSchema.shape.effect,
  focus_x: beautifyOptionsSchema.shape.focusX,
  focus_y: beautifyOptionsSchema.shape.focusY,
  zoom: beautifyOptionsSchema.shape.zoom,
  width: beautifyOptionsSchema.shape.width,
  format: beautifyOptionsSchema.shape.format,
  quality: beautifyOptionsSchema.shape.quality
};

function optionsFrom(input: Record<string, unknown>) {
  return beautifyOptionsSchema.parse({
    background: input.background,
    aspectRatio: input.aspect_ratio,
    fit: input.fit,
    padding: input.padding,
    radius: input.radius,
    shadow: input.shadow,
    style: input.style,
    look: input.look,
    effect: input.effect,
    focusX: input.focus_x,
    focusY: input.focus_y,
    zoom: input.zoom,
    width: input.width,
    format: input.format,
    quality: input.quality
  });
}

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
          ...renderOptionShape
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
      },
      async (input) => {
        const bytes = Buffer.from(input.image_base64, 'base64');
        if (!bytes.length || bytes.length > 20 * 1024 * 1024) throw new Error('Screenshot must be between 1 byte and 20 MB');
        const options = optionsFrom(input);
        const rendered = await renderScene({ imageDataUrl: `data:${input.mime_type};base64,${bytes.toString('base64')}`, options });
        return {
          content: [
            { type: 'image' as const, data: rendered.toString('base64'), mimeType: options.format === 'jpeg' ? 'image/jpeg' : 'image/png' },
            { type: 'text' as const, text: `Done. ${options.width}px ${options.aspectRatio} DevShot with ${options.background} background.` }
          ]
        };
      }
    );

    server.registerTool(
      'beautify_snippet',
      {
        title: 'Beautify code or terminal output',
        description: 'Render code with Shiki or raw terminal output inside an opinionated DevShot frame.',
        inputSchema: {
          content: z.string().min(1).max(40_000),
          mode: z.enum(['code', 'terminal']).default('code'),
          language: z.string().max(32).default('text'),
          filename: z.string().max(160).optional(),
          ...renderOptionShape
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
      },
      async (input) => {
        const options = optionsFrom(input);
        const rendered = await renderScene({ kind: input.mode, content: input.content, language: input.language, label: input.filename, options });
        return { content: [
          { type: 'image' as const, data: rendered.toString('base64'), mimeType: options.format === 'jpeg' ? 'image/jpeg' : 'image/png' },
          { type: 'text' as const, text: `Done. ${input.mode === 'terminal' ? 'Terminal' : input.language} snippet rendered with DevShot.` }
        ] };
      }
    );

    server.registerTool(
      'beautify_website',
      {
        title: 'Beautify a public website',
        description: 'Capture a public website in an isolated browser and render it in an opinionated DevShot browser frame.',
        inputSchema: {
          url: z.string().url().max(2048),
          viewport: z.enum(['desktop', 'mobile']).default('desktop'),
          ...renderOptionShape
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true }
      },
      async (input) => {
        const options = optionsFrom({ ...input, style: input.style ?? 'browser', fit: input.fit ?? 'cover' });
        const capture = await captureWebsite(input.url, input.viewport);
        const rendered = await renderScene({
          kind: 'website',
          imageDataUrl: `data:image/png;base64,${capture.buffer.toString('base64')}`,
          sourceWidth: capture.width,
          sourceHeight: capture.height,
          label: capture.finalUrl,
          options
        });
        return { content: [
          { type: 'image' as const, data: rendered.toString('base64'), mimeType: options.format === 'jpeg' ? 'image/jpeg' : 'image/png' },
          { type: 'text' as const, text: `Done. Captured ${capture.finalUrl} at ${capture.width}×${capture.height}.` }
        ] };
      }
    );
  },
  { serverInfo: { name: 'DevShot', version: '0.1.0' } },
  { maxDuration: 60, streamableHttpEndpoint: '/mcp', disableSse: true }
);

export const POST: RequestHandler = async ({ request }) => (await handler(request)) ?? new Response(null, { status: 200 });
export const GET: RequestHandler = async ({ request }) => {
  if ((request.headers.get('accept') ?? '').includes('text/html')) return new Response(null, { status: 303, headers: { location: `${getSiteUrl()}/#mcp` } });
  return Response.json({ name: 'DevShot', transport: 'streamable-http', endpoint: getMcpUrl(), authentication: 'none', tool: 'beautify_screenshot' });
};
export const DELETE: RequestHandler = async ({ request }) => (await handler(request)) ?? new Response(null, { status: 200 });
