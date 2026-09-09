import { chromium, type Browser } from 'playwright';
import { createSceneDocument, safeDataUrl, type SceneInput } from '../core/scene';

let browserPromise: Promise<Browser> | undefined;

async function browser() {
  browserPromise ??= chromium.launch({
    channel: 'chrome-beta',
    headless: true,
    args: ['--enable-features=CanvasDrawElement']
  }).catch((error) => {
    browserPromise = undefined;
    throw new Error(`DevShot requires a local Chrome Beta with HTML-in-Canvas enabled. ${error instanceof Error ? error.message : String(error)}`);
  });
  return browserPromise;
}

export async function renderScene(input: SceneInput): Promise<Buffer> {
  const instance = await browser();
  const page = await instance.newPage({ deviceScaleFactor: 1 });
  try {
    let sourceWidth = input.sourceWidth;
    let sourceHeight = input.sourceHeight;
    if (!sourceWidth || !sourceHeight) {
      const source = safeDataUrl(input.imageDataUrl);
      await page.setContent(`<img id="probe" src="${source}">`, { waitUntil: 'load' });
      const dimensions = await page.locator('#probe').evaluate((image) => {
        const element = image as HTMLImageElement;
        return { width: element.naturalWidth, height: element.naturalHeight };
      });
      sourceWidth = dimensions.width;
      sourceHeight = dimensions.height;
    }
    await page.setContent(createSceneDocument({ ...input, sourceWidth, sourceHeight }), { waitUntil: 'load' });
    await page.waitForFunction(() => (window as unknown as { __DEVSHOT_READY__?: boolean }).__DEVSHOT_READY__ === true, null, { timeout: 15_000 });
    return await page.locator('#shot').screenshot({
      type: input.options.format === 'jpeg' ? 'jpeg' : 'png',
      quality: input.options.format === 'jpeg' ? input.options.quality : undefined
    });
  } finally {
    await page.close();
  }
}
