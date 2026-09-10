import { chromium, type Browser } from 'playwright';

let browserPromise: Promise<Browser> | undefined;

export async function chromeBrowser(): Promise<Browser> {
  if (!browserPromise) {
    const launch = chromium.launch({
      channel: 'chrome-beta',
      headless: true,
      args: ['--enable-features=CanvasDrawElement']
    }).then((browser) => {
      browser.on('disconnected', () => {
        if (browserPromise === launch) browserPromise = undefined;
      });
      return browser;
    }).catch((error) => {
      if (browserPromise === launch) browserPromise = undefined;
      throw new Error(`DevShot requires Chrome Beta with HTML-in-Canvas enabled. Install it with "pnpm exec playwright install chrome-beta", then restart DevShot. ${error instanceof Error ? error.message : String(error)}`);
    });
    browserPromise = launch;
  }
  return browserPromise;
}
