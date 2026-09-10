import { chromium, type Browser } from 'playwright';

let browserPromise: Promise<Browser> | undefined;

export async function chromeBrowser(): Promise<Browser> {
  if (!browserPromise) {
    const channel = process.env.DEVSHOT_CHROME_CHANNEL?.trim() || 'chrome-beta';
    const launch = chromium.launch({
      ...(channel === 'chromium' ? {} : { channel }),
      headless: true,
      args: ['--enable-features=CanvasDrawElement']
    }).then((browser) => {
      browser.on('disconnected', () => {
        if (browserPromise === launch) browserPromise = undefined;
      });
      return browser;
    }).catch((error) => {
      if (browserPromise === launch) browserPromise = undefined;
      const installTarget = channel === 'chromium' ? 'chromium' : channel;
      throw new Error(`DevShot requires ${channel === 'chromium' ? 'Playwright Chromium' : channel} with HTML-in-Canvas enabled. Install it with "pnpm exec playwright install ${installTarget}", then restart DevShot. ${error instanceof Error ? error.message : String(error)}`);
    });
    browserPromise = launch;
  }
  return browserPromise;
}
