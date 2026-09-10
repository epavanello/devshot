import { describe, expect, it } from 'vitest';
import { sceneContentHtml, sceneModel, sceneSize } from './scene-model';

const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nL8AAAAASUVORK5CYII=';
const siteUrl = 'https://devshot.emadev.co';

describe('scene model', () => {
  it('creates a deterministic 16:9 scene', () => {
    expect(sceneSize({ sourceWidth: 1200, sourceHeight: 800, options: { width: 1600 } })).toMatchObject({ width: 1600, height: 900 });
  });

  it('contains large images without upscaling small images', () => {
    const large = sceneModel({ imageDataUrl: pixel, sourceWidth: 2400, sourceHeight: 1600, siteUrl, options: { width: 1600, padding: 96, fit: 'contain' } });
    const small = sceneModel({ imageDataUrl: pixel, sourceWidth: 320, sourceHeight: 200, siteUrl, options: { width: 1600, padding: 96, fit: 'contain' } });

    expect(large).toMatchObject({ imageWidth: 1062, imageHeight: 708 });
    expect(small).toMatchObject({ imageWidth: 320, imageHeight: 200 });
  });

  it('keeps the top of a full-page website available for panning', () => {
    const top = sceneModel({ kind: 'website', imageDataUrl: pixel, sourceWidth: 1440, sourceHeight: 6000, siteUrl, options: { fit: 'cover', focusY: 0 } });
    const bottom = sceneModel({ kind: 'website', imageDataUrl: pixel, sourceWidth: 1440, sourceHeight: 6000, siteUrl, options: { fit: 'cover', focusY: 1 } });

    expect(top.imageTop!).toBeGreaterThan(bottom.imageTop!);
    expect(top.chrome).toBe(true);
  });

  it('rejects unsafe image and watermark URLs', () => {
    expect(() => sceneModel({ imageDataUrl: 'https://example.com/image.png', sourceWidth: 1, sourceHeight: 1, siteUrl, options: {} })).toThrow('data URL');
    expect(() => sceneModel({ imageDataUrl: pixel, sourceWidth: 1, sourceHeight: 1, siteUrl: 'javascript:alert(1)', options: {} })).toThrow('http or https');
  });

  it('renders highlighted code and terminal content', async () => {
    const code = await sceneContentHtml('code', 'const pop: boolean = true;', 'typescript');
    const terminal = await sceneContentHtml('terminal', '$ pnpm test\n✓ passed');

    expect(code).toContain('class="shiki vitesse-dark"');
    expect(terminal).toContain('class="terminal"');
  });
});
