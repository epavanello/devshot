import { chromium, type Browser } from 'playwright';

let browserPromise: Promise<Browser> | undefined;

export async function chromeBrowser(): Promise<Browser> {
  browserPromise ??= chromium.launch({
    channel: 'chrome-beta',
    headless: true,
    args: ['--enable-features=CanvasDrawElement']
  }).catch((error) => {
    browserPromise = undefined;
    throw new Error(`DevShot requires Chrome Beta with HTML-in-Canvas enabled. Install it with "pnpm exec playwright install chrome-beta", then restart DevShot. ${error instanceof Error ? error.message : String(error)}`);
  });
  return browserPromise;
}
