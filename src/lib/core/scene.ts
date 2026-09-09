import { backgrounds, beautifyOptionsSchema, ratioValue, type BeautifyOptions } from './options';

export interface SceneInput {
  imageDataUrl: string;
  sourceWidth?: number;
  sourceHeight?: number;
  options: Partial<BeautifyOptions>;
}

export function safeDataUrl(value: string): string {
  if (!/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(value)) throw new Error('Expected a PNG, JPEG or WebP data URL');
  return value.replace(/\s/g, '');
}

function attr(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function sceneSize(input: Pick<SceneInput, 'sourceWidth' | 'sourceHeight' | 'options'>) {
  const options = beautifyOptionsSchema.parse(input.options);
  if (!input.sourceWidth || !input.sourceHeight || input.sourceWidth < 1 || input.sourceHeight < 1) throw new Error('Valid source dimensions are required');
  const sourceRatio = input.sourceWidth / input.sourceHeight;
  const ratio = ratioValue(options.aspectRatio, sourceRatio);
  const width = options.width;
  const height = options.aspectRatio === 'original'
    ? Math.round(width / sourceRatio + options.padding * 2)
    : Math.round(width / ratio);
  return { width, height, options };
}

export function createSceneDocument(input: SceneInput): string {
  const { width, height, options } = sceneSize(input);
  const colors = backgrounds[options.background].colors;
  const scale = width / 1600;
  const padding = Math.round(Math.min(options.padding * scale, width * 0.38, height * 0.38));
  const image = attr(safeDataUrl(input.imageDataUrl));
  const shadow = {
    none: 'none',
    soft: `0 ${Math.round(18 * scale)}px ${Math.round(44 * scale)}px rgba(12,10,30,.24)`,
    float: `0 ${Math.round(28 * scale)}px ${Math.round(72 * scale)}px rgba(12,10,30,.34)`,
    hard: `${Math.round(16 * scale)}px ${Math.round(16 * scale)}px 0 rgba(12,10,30,.52)`
  }[options.shadow];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;background:transparent;overflow:hidden;width:${width}px;height:${height}px}
    #shot{display:block;width:${width}px;height:${height}px}
    #scene{position:relative;width:${width}px;height:${height}px;padding:${padding}px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${colors.join(',')});isolation:isolate;overflow:hidden}
    #scene:before{content:"";position:absolute;inset:-20%;z-index:-1;background:radial-gradient(circle at 18% 12%,rgba(255,255,255,.52),transparent 28%),radial-gradient(circle at 86% 86%,rgba(255,255,255,.22),transparent 30%);mix-blend-mode:overlay}
    #scene:after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;opacity:.075;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
    img{display:block;max-width:100%;max-height:100%;width:${options.fit === 'cover' ? '100%' : 'auto'};height:${options.fit === 'cover' ? '100%' : 'auto'};object-fit:${options.fit};object-position:center;border-radius:${Math.round(options.radius * scale)}px;box-shadow:${shadow};position:relative;z-index:1}
  </style></head><body>
    <canvas id="shot" width="${width}" height="${height}" layoutsubtree>
      <div id="scene" drawable><img id="source" src="${image}" alt=""></div>
    </canvas>
    <script>
      window.__DEVSHOT_READY__ = false;
      const canvas = document.getElementById('shot');
      const scene = document.getElementById('scene');
      const source = document.getElementById('source');
      const context = canvas.getContext('2d');
      canvas.onpaint = () => {
        context.reset();
        context.drawElementImage(scene, 0, 0, ${width}, ${height});
        window.__DEVSHOT_READY__ = true;
      };
      source.decode().then(() => canvas.requestPaint());
    <\/script>
  </body></html>`;
}
