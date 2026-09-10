import { createSceneDocument, safeDataUrl, type SceneInput } from '../core/scene';
import { getSiteUrl } from '../config/site';
import { chromeBrowser } from './browser';

type RenderSceneInput = Omit<SceneInput, 'siteUrl'> & { siteUrl?: string };

export async function renderScene(input: RenderSceneInput): Promise<Buffer> {
  const instance = await chromeBrowser();
  const page = await instance.newPage({ deviceScaleFactor: 1 });
  try {
    let sourceWidth = input.sourceWidth;
    let sourceHeight = input.sourceHeight;
    if ((!input.kind || input.kind === 'image' || input.kind === 'website') && (!sourceWidth || !sourceHeight)) {
      const source = safeDataUrl(input.imageDataUrl ?? '');
      await page.setContent(`<img id="probe" src="${source}">`, { waitUntil: 'load' });
      const dimensions = await page.locator('#probe').evaluate((image) => {
        const element = image as HTMLImageElement;
        return { width: element.naturalWidth, height: element.naturalHeight };
      });
      sourceWidth = dimensions.width;
      sourceHeight = dimensions.height;
    }
    await page.setContent(await createSceneDocument({ ...input, sourceWidth, sourceHeight, siteUrl: input.siteUrl ?? getSiteUrl() }), { waitUntil: 'load' });
    await page.waitForFunction(() => (window as unknown as { __DEVSHOT_READY__?: boolean }).__DEVSHOT_READY__ === true, null, { timeout: 15_000 });
    return await page.locator('#shot').screenshot({
      type: input.options.format === 'jpeg' ? 'jpeg' : 'png',
      quality: input.options.format === 'jpeg' ? input.options.quality : undefined
    });
  } finally {
    await page.close();
  }
}
