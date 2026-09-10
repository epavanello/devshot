import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { standardBrowser } from './browser';

export type CaptureViewport = 'desktop' | 'mobile';

const viewports = {
  desktop: { width: 1440, height: 1000, isMobile: false },
  mobile: { width: 390, height: 844, isMobile: true }
} as const;

function isPrivateIpv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19));
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) return isPrivateIpv4(address);
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return isPrivateIpv4(mappedIpv4);
  return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
    normalized.startsWith('fea') || normalized.startsWith('feb');
}

const checkedHosts = new Map<string, Promise<void>>();

async function assertPublicUrl(value: string): Promise<URL> {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only public http and https URLs can be captured');
  if (url.username || url.password) throw new Error('URLs with embedded credentials are not supported');
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) throw new Error('Local URLs cannot be captured');
  let check = checkedHosts.get(hostname);
  if (!check) {
    check = lookup(hostname, { all: true, verbatim: true }).then((addresses) => {
      if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error('Private network URLs cannot be captured');
    });
    checkedHosts.set(hostname, check);
  }
  await check;
  return url;
}

export async function captureWebsite(value: string, viewportName: CaptureViewport) {
  const url = await assertPublicUrl(value);
  const viewport = viewports[viewportName];
  const browser = await standardBrowser();
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  try {
    await page.route('**/*', async (route) => {
      const requestUrl = route.request().url();
      if (/^(data|blob|about):/.test(requestUrl)) return route.continue();
      try {
        await assertPublicUrl(requestUrl);
        await route.continue();
      } catch {
        await route.abort('blockedbyclient');
      }
    });
    const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    if (!response) throw new Error('The website did not return a document');
    if (response.status() >= 400) throw new Error(`The website returned HTTP ${response.status()}`);
    if (viewport.isMobile) await page.evaluate(() => {
      let viewportMeta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.append(viewportMeta);
      }
      viewportMeta.content = 'width=device-width, initial-scale=1';
    });
    await page.addStyleTag({ content: 'html,body{overflow-x:clip!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
    await page.evaluate(() => document.fonts.ready).catch(() => undefined);
    await page.waitForTimeout(350);
    const buffer = await page.screenshot({ type: 'png', animations: 'disabled', fullPage: true });
    return {
      buffer,
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
      finalUrl: page.url()
    };
  } finally {
    await context.close();
  }
}
