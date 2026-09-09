import { describe, expect, it } from 'vitest';
import { createSceneDocument, sceneSize } from './scene';

const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nL8AAAAASUVORK5CYII=';

describe('scene document', () => {
  it('creates a deterministic 16:9 scene', () => {
    expect(sceneSize({ sourceWidth: 1200, sourceHeight: 800, options: { width: 1600 } })).toMatchObject({ width: 1600, height: 900 });
  });

  it('embeds the image and exact product styles', () => {
    const html = createSceneDocument({ imageDataUrl: pixel, sourceWidth: 1, sourceHeight: 1, options: { background: 'electric' } });
    expect(html).toContain(pixel);
    expect(html).toContain('linear-gradient');
    expect(html).toContain('id="shot"');
  });
});
