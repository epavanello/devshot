import { describe, expect, it } from 'vitest';
import { createSceneDocument, sceneSize } from './scene';

const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nL8AAAAASUVORK5CYII=';
const siteUrl = 'https://devshot.emadev.co';

describe('scene document', () => {
  it('creates a deterministic 16:9 scene', () => {
    expect(sceneSize({ sourceWidth: 1200, sourceHeight: 800, options: { width: 1600 } })).toMatchObject({ width: 1600, height: 900 });
  });

  it('embeds the image and exact product styles', async () => {
    const html = await createSceneDocument({ imageDataUrl: pixel, sourceWidth: 1, sourceHeight: 1, siteUrl, options: { background: 'electric' } });
    expect(html).toContain(pixel);
    expect(html).toContain('linear-gradient');
    expect(html).toContain('id="shot"');
    expect(html).toContain('context.drawElementImage(scene, 0, 0, 1600, 900);');
    expect(html).toContain('id="watermark"');
    expect(html).toContain('Made with DevShot');
    expect(html).toContain('devshot.emadev.co');
    expect(html).toContain('id="devshot-watermark-mark"');
    expect(html).not.toContain('preserveElementGeometry');
  });

  it('scales a large contained image down without upscaling small images', async () => {
    const large = await createSceneDocument({ imageDataUrl: pixel, sourceWidth: 2400, sourceHeight: 1600, siteUrl, options: { width: 1600, padding: 96, fit: 'contain' } });
    const small = await createSceneDocument({ imageDataUrl: pixel, sourceWidth: 320, sourceHeight: 200, siteUrl, options: { width: 1600, padding: 96, fit: 'contain' } });

    expect(large).toContain('width:1062px;height:708px');
    expect(small).toContain('width:320px;height:200px');
  });

  it('fits the full canvas inside an embedded preview viewport', async () => {
    const html = await createSceneDocument({ imageDataUrl: pixel, sourceWidth: 1200, sourceHeight: 800, siteUrl, options: { width: 1600, aspectRatio: '9:16' } });

    expect(html).toContain("if(window.frameElement)document.documentElement.classList.add('preview')");
    expect(html).toContain('html.preview #shot{width:min(100vw,56.25879vh);height:min(100vh,177.75vw)}');
  });

  it('rejects unsafe watermark URLs', async () => {
    await expect(createSceneDocument({ imageDataUrl: pixel, sourceWidth: 1, sourceHeight: 1, siteUrl: 'javascript:alert(1)', options: {} })).rejects.toThrow('must use http or https');
  });

  it('renders highlighted code and terminal content as HTML', async () => {
    const code = await createSceneDocument({ kind: 'code', content: 'const pop: boolean = true;', language: 'typescript', label: 'demo.ts', siteUrl, options: {} });
    const terminal = await createSceneDocument({ kind: 'terminal', content: '$ pnpm test\n✓ passed', label: 'Terminal', siteUrl, options: {} });

    expect(code).toContain('class="shiki vitesse-dark"');
    expect(code).toContain('demo.ts');
    expect(terminal).toContain('class="terminal"');
    expect(terminal).toContain('$ pnpm test');
  });
});
