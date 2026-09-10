import { backgrounds, beautifyOptionsSchema, ratioValue, type BeautifyOptions } from './options';
import { highlightCode, normalizeLanguage, terminalHtml } from './snippet';

export type SceneKind = 'image' | 'website' | 'code' | 'terminal';

export interface SceneInput {
  kind?: SceneKind;
  imageDataUrl?: string;
  sourceWidth?: number;
  sourceHeight?: number;
  content?: string;
  language?: string;
  label?: string;
  siteUrl: string;
  options: Partial<BeautifyOptions>;
}

export function isVisual(input: SceneInput): boolean {
  return !input.kind || input.kind === 'image' || input.kind === 'website';
}

export function safeDataUrl(value: string): string {
  if (!/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(value)) throw new Error('Expected a PNG, JPEG or WebP data URL');
  return value.replace(/\s/g, '');
}

export function sceneSize(input: Pick<SceneInput, 'kind' | 'sourceWidth' | 'sourceHeight' | 'options'>) {
  const options = beautifyOptionsSchema.parse(input.options);
  const visual = !input.kind || input.kind === 'image' || input.kind === 'website';
  if (visual && (!input.sourceWidth || !input.sourceHeight || input.sourceWidth < 1 || input.sourceHeight < 1)) {
    throw new Error('Valid source dimensions are required');
  }
  const sourceRatio = visual ? input.sourceWidth! / input.sourceHeight! : 16 / 9;
  const ratio = ratioValue(options.aspectRatio, sourceRatio);
  const width = options.width;
  const height = options.aspectRatio === 'original'
    ? Math.round(width / sourceRatio + options.padding * 2)
    : Math.round(width / ratio);
  return { width, height, options };
}

export function sceneModel(input: SceneInput) {
  const { width, height, options } = sceneSize(input);
  const visual = isVisual(input);
  const scale = width / 1600;
  const padding = Math.round(Math.min(options.padding * scale, width * 0.38, height * 0.38));
  const contentWidth = width - padding * 2;
  const contentHeight = height - padding * 2;
  const radius = Math.round(options.radius * scale);
  const shadow = {
    none: 'none',
    soft: `0 ${Math.round(18 * scale)}px ${Math.round(44 * scale)}px rgba(12,10,30,.24)`,
    float: `0 ${Math.round(28 * scale)}px ${Math.round(72 * scale)}px rgba(12,10,30,.34)`,
    hard: `${Math.round(16 * scale)}px ${Math.round(16 * scale)}px 0 rgba(12,10,30,.52)`
  }[options.shadow];
  const site = new URL(input.siteUrl);
  if (!['http:', 'https:'].includes(site.protocol)) throw new Error('Watermark URL must use http or https');

  if (!visual) {
    const code = (input.content ?? '').slice(0, 40_000).replace(/^\n+|\n+$/g, '');
    if (!code) throw new Error('Snippet content is required');
    const mode = input.kind === 'terminal' ? 'terminal' : 'code';
    const lineCount = code.split('\n').length;
    return {
      width, height, options, scale, padding, contentWidth, contentHeight, radius, shadow, site,
      visual, code, mode,
      label: input.label?.trim() || (mode === 'terminal' ? 'Terminal' : normalizeLanguage(input.language)),
      fontSize: Math.max(Math.round(18 * scale), Math.round((lineCount < 9 ? 30 : lineCount < 18 ? 24 : 19) * scale))
    };
  }

  const chrome = input.kind === 'website' || options.style === 'browser';
  const chromeHeight = chrome ? Math.round(58 * scale) : 0;
  const mediaHeight = contentHeight - chromeHeight;
  const sourceWidth = input.sourceWidth!;
  const sourceHeight = input.sourceHeight!;
  const containScale = Math.min(1, contentWidth / sourceWidth, mediaHeight / sourceHeight);
  const coverScale = Math.max(contentWidth / sourceWidth, mediaHeight / sourceHeight) * options.zoom;
  const imageScale = options.fit === 'cover' ? coverScale : containScale;
  const imageWidth = Math.max(1, Math.floor(sourceWidth * imageScale));
  const imageHeight = Math.max(1, Math.floor(sourceHeight * imageScale));
  const frameWidth = options.fit === 'cover' || chrome ? contentWidth : imageWidth;
  const frameMediaHeight = options.fit === 'cover' || chrome ? mediaHeight : imageHeight;
  const overflowX = Math.max(0, imageWidth - frameWidth);
  const overflowY = Math.max(0, imageHeight - frameMediaHeight);

  return {
    width, height, options, scale, padding, contentWidth, contentHeight, radius, shadow, site,
    visual, chrome, chromeHeight, frameWidth, frameMediaHeight, imageWidth, imageHeight,
    imageLeft: Math.round((frameWidth - imageWidth) / 2 - (options.focusX - 0.5) * overflowX),
    imageTop: Math.round((frameMediaHeight - imageHeight) / 2 - (options.focusY - 0.5) * overflowY),
    image: safeDataUrl(input.imageDataUrl ?? ''),
    label: input.label?.trim() || (input.kind === 'website' ? 'https://example.com' : 'devshot://screenshot')
  };
}

export async function sceneContentHtml(kind: SceneKind | undefined, content: string | undefined, language?: string): Promise<string> {
  if (!kind || kind === 'image' || kind === 'website') return '';
  const code = (content ?? '').slice(0, 40_000).replace(/^\n+|\n+$/g, '');
  if (!code) throw new Error('Snippet content is required');
  return kind === 'terminal' ? terminalHtml(code) : highlightCode(code, language);
}

export const sceneBackground = (options: BeautifyOptions) => backgrounds[options.background].colors.join(',');
