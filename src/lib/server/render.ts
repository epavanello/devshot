import { safeDataUrl, type SceneInput } from '../core/scene-model';
import { beautifyOptionsSchema } from '../core/options';
import { getSiteUrl } from '../config/site';
import { chromeBrowser } from './browser';

type RenderSceneInput = Omit<SceneInput, 'siteUrl'> & { siteUrl?: string };

function rendererUrl(): string {
  const origin = process.env.DEVSHOT_RENDER_ORIGIN?.trim()
    || (process.env.PORT
      ? `http://127.0.0.1:${process.env.PORT}`
      : process.env.NODE_ENV === 'production' ? getSiteUrl() : 'http://127.0.0.1:4173');
  return new URL('/render', origin).href;
}

export async function renderScene(input: RenderSceneInput): Promise<Buffer> {
  if (!input.kind || input.kind === 'image' || input.kind === 'website') safeDataUrl(input.imageDataUrl ?? '');
  const options = beautifyOptionsSchema.parse(input.options);
  const instance = await chromeBrowser();
  const page = await instance.newPage();
  try {
    await page.goto(rendererUrl(), { waitUntil: 'load', timeout: 15_000 });
    await page.waitForFunction(() => typeof window.__DEVSHOT_RENDER__ === 'function');
    await page.evaluate((value) => Promise.race([
      window.__DEVSHOT_RENDER__!(value),
      new Promise((_, reject) => setTimeout(() => reject(new Error('The HTML-in-Canvas scene did not finish rendering')), 15_000))
    ]), {
      ...input,
      options,
      siteUrl: input.siteUrl ?? getSiteUrl()
    } as SceneInput);
    const dataUrl = await page.locator('#shot').evaluate((canvas, output) =>
      (canvas as HTMLCanvasElement).toDataURL(`image/${output.format}`, output.quality / 100), options);
    return Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  } finally {
    await page.close();
  }
}
