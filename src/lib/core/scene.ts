import { backgrounds, beautifyOptionsSchema, ratioValue, type BeautifyOptions } from './options';
import { escapeHtml, highlightCode, normalizeLanguage, terminalHtml } from './snippet';

export type SceneKind = 'image' | 'website' | 'code' | 'terminal';

export interface SceneInput {
  kind?: SceneKind;
  imageDataUrl?: string;
  sourceWidth?: number;
  sourceHeight?: number;
  content?: string;
  language?: string;
  label?: string;
  siteUrl: string;
  options: Partial<BeautifyOptions>;
}

export function safeDataUrl(value: string): string {
  if (!/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(value)) throw new Error('Expected a PNG, JPEG or WebP data URL');
  return value.replace(/\s/g, '');
}

function attr(value: string): string {
  return escapeHtml(value);
}

function isVisual(input: SceneInput): boolean {
  return !input.kind || input.kind === 'image' || input.kind === 'website';
}

function watermarkUrl(value: string): URL {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Watermark URL must use http or https');
  return url;
}

export function sceneSize(input: Pick<SceneInput, 'kind' | 'sourceWidth' | 'sourceHeight' | 'options'>) {
  const options = beautifyOptionsSchema.parse(input.options);
  const visual = !input.kind || input.kind === 'image' || input.kind === 'website';
  if (visual && (!input.sourceWidth || !input.sourceHeight || input.sourceWidth < 1 || input.sourceHeight < 1)) {
    throw new Error('Valid source dimensions are required');
  }
  const sourceRatio = visual ? input.sourceWidth! / input.sourceHeight! : 16 / 9;
  const ratio = ratioValue(options.aspectRatio, sourceRatio);
  const width = options.width;
  const height = options.aspectRatio === 'original'
    ? Math.round(width / sourceRatio + options.padding * 2)
    : Math.round(width / ratio);
  return { width, height, options };
}

function shadowValue(options: BeautifyOptions, scale: number): string {
  return {
    none: 'none',
    soft: `0 ${Math.round(18 * scale)}px ${Math.round(44 * scale)}px rgba(12,10,30,.24)`,
    float: `0 ${Math.round(28 * scale)}px ${Math.round(72 * scale)}px rgba(12,10,30,.34)`,
    hard: `${Math.round(16 * scale)}px ${Math.round(16 * scale)}px 0 rgba(12,10,30,.52)`
  }[options.shadow];
}

async function sceneContent(input: SceneInput, width: number, height: number, padding: number, scale: number, options: BeautifyOptions) {
  const contentWidth = width - padding * 2;
  const contentHeight = height - padding * 2;
  const radius = Math.round(options.radius * scale);
  const shadow = shadowValue(options, scale);

  if (!isVisual(input)) {
    const code = (input.content ?? '').slice(0, 40_000).replace(/^\n+|\n+$/g, '');
    if (!code) throw new Error('Snippet content is required');
    const mode = input.kind === 'terminal' ? 'terminal' : 'code';
    const markup = mode === 'terminal' ? terminalHtml(code) : await highlightCode(code, input.language);
    const label = attr(input.label?.trim() || (mode === 'terminal' ? 'Terminal' : normalizeLanguage(input.language)));
    const lineCount = code.split('\n').length;
    const fontSize = Math.max(Math.round(18 * scale), Math.round((lineCount < 9 ? 30 : lineCount < 18 ? 24 : 19) * scale));
    return {
      markup: `<div class="snippet-card frame-${options.style}"><div class="window-bar"><span class="traffic"><i></i><i></i><i></i></span><span>${label}</span><b>${mode === 'terminal' ? 'SHELL' : 'CODE'}</b></div><div class="snippet-body">${markup}</div></div>`,
      css: `.snippet-card{position:relative;width:${contentWidth}px;max-height:${contentHeight}px;border-radius:${radius}px;overflow:hidden;background:#121217;box-shadow:${shadow};z-index:1}.window-bar{height:${Math.round(54 * scale)}px;padding:0 ${Math.round(20 * scale)}px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;background:#202027;color:#aaa8b2;font:600 ${Math.round(11 * scale)}px/1 sans-serif;letter-spacing:.12em;text-transform:uppercase}.window-bar b{justify-self:end;color:#d8ff52;font-size:${Math.round(9 * scale)}px}.traffic{display:flex;gap:${Math.round(7 * scale)}px}.traffic i{display:block;width:${Math.round(10 * scale)}px;height:${Math.round(10 * scale)}px;border-radius:50%;background:#ff5f57}.traffic i:nth-child(2){background:#febc2e}.traffic i:nth-child(3){background:#28c840}.snippet-body{max-height:${contentHeight - Math.round(54 * scale)}px;overflow:hidden;padding:${Math.round(34 * scale)}px ${Math.round(38 * scale)}px;background:linear-gradient(145deg,#17171d,#101014)}.snippet-body pre{margin:0!important;padding:0!important;background:transparent!important;font:${fontSize}px/${mode === 'terminal' ? 1.58 : 1.55} ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;white-space:pre-wrap;overflow-wrap:anywhere}.snippet-body code{font:inherit}.terminal{color:#f5f4f7}.frame-poster{transform:rotate(-1.15deg);outline:${Math.max(2, Math.round(3 * scale))}px solid rgba(255,255,255,.75)}.frame-browser .window-bar{background:#f4f1e9;color:#5d5962}.frame-browser .snippet-body{background:#18181d}`
    };
  }

  const chrome = input.kind === 'website' || options.style === 'browser';
  const chromeHeight = chrome ? Math.round(58 * scale) : 0;
  const mediaHeight = contentHeight - chromeHeight;
  const sourceWidth = input.sourceWidth!;
  const sourceHeight = input.sourceHeight!;
  const containScale = Math.min(1, contentWidth / sourceWidth, mediaHeight / sourceHeight);
  const coverScale = Math.max(contentWidth / sourceWidth, mediaHeight / sourceHeight) * options.zoom;
  const imageScale = options.fit === 'cover' ? coverScale : containScale;
  const imageWidth = Math.max(1, Math.floor(sourceWidth * imageScale));
  const imageHeight = Math.max(1, Math.floor(sourceHeight * imageScale));
  const frameWidth = options.fit === 'cover' || chrome ? contentWidth : imageWidth;
  const frameMediaHeight = options.fit === 'cover' || chrome ? mediaHeight : imageHeight;
  const overflowX = Math.max(0, imageWidth - frameWidth);
  const overflowY = Math.max(0, imageHeight - frameMediaHeight);
  const imageLeft = Math.round((frameWidth - imageWidth) / 2 - (options.focusX - 0.5) * overflowX);
  const imageTop = Math.round((frameMediaHeight - imageHeight) / 2 - (options.focusY - 0.5) * overflowY);
  const label = attr(input.label?.trim() || (input.kind === 'website' ? 'https://example.com' : 'devshot://screenshot'));
  const image = attr(safeDataUrl(input.imageDataUrl ?? ''));

  return {
    markup: `<div class="capture frame-${options.style}">${chrome ? `<div class="browser-bar"><span class="traffic"><i></i><i></i><i></i></span><span class="address">${label}</span><b>↗</b></div>` : ''}<div class="media"><img id="source" src="${image}" alt=""></div></div>`,
    css: `.capture{position:relative;width:${frameWidth}px;height:${frameMediaHeight + chromeHeight}px;border-radius:${radius}px;box-shadow:${shadow};z-index:1}.media{position:relative;width:${frameWidth}px;height:${frameMediaHeight}px;overflow:hidden;border-radius:${chrome ? `0 0 ${radius}px ${radius}px` : `${radius}px`};background:rgba(255,255,255,.1)}.media img{display:block;position:absolute;left:${imageLeft}px;top:${imageTop}px;width:${imageWidth}px;height:${imageHeight}px;max-width:none;object-fit:fill}.browser-bar{height:${chromeHeight}px;padding:0 ${Math.round(17 * scale)}px;display:grid;grid-template-columns:auto 1fr auto;gap:${Math.round(18 * scale)}px;align-items:center;border-radius:${radius}px ${radius}px 0 0;background:#f8f6ef;color:#27262b;font:600 ${Math.round(12 * scale)}px/1 sans-serif}.traffic{display:flex;gap:${Math.round(7 * scale)}px}.traffic i{display:block;width:${Math.round(10 * scale)}px;height:${Math.round(10 * scale)}px;border-radius:50%;background:#ff5f57}.traffic i:nth-child(2){background:#febc2e}.traffic i:nth-child(3){background:#28c840}.address{min-width:0;padding:${Math.round(9 * scale)}px ${Math.round(15 * scale)}px;border-radius:999px;background:#e9e6dd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#6a676f}.frame-poster{transform:rotate(-1.15deg);outline:${Math.max(2, Math.round(3 * scale))}px solid rgba(255,255,255,.78)}.frame-poster:before{content:"";position:absolute;inset:${Math.round(15 * scale)}px ${Math.round(-15 * scale)}px ${Math.round(-15 * scale)}px ${Math.round(15 * scale)}px;border-radius:inherit;background:#7137ff;z-index:-1}.frame-clean{}`
  };
}

export async function createSceneDocument(input: SceneInput): Promise<string> {
  const { width, height, options } = sceneSize(input);
  const colors = backgrounds[options.background].colors;
  const scale = width / 1600;
  const padding = Math.round(Math.min(options.padding * scale, width * 0.38, height * 0.38));
  const previewWidthInVh = Number((width / height * 100).toFixed(6));
  const previewHeightInVw = Number((height / width * 100).toFixed(6));
  const site = watermarkUrl(input.siteUrl);
  const watermarkLabel = attr(site.hostname || site.host);
  const content = await sceneContent(input, width, height, padding, scale, options);
  return `<!doctype html><html><head><meta charset="utf-8"><script>if(window.frameElement)document.documentElement.classList.add('preview');<\/script><style>
    *{box-sizing:border-box}html,body{margin:0;background:transparent;overflow:hidden;width:${width}px;height:${height}px}
    #shot{display:block;width:${width}px;height:${height}px}
    #scene{position:relative;width:${width}px;height:${height}px;padding:${padding}px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${colors.join(',')});isolation:isolate;overflow:hidden}
    #scene:before{content:"";position:absolute;inset:-20%;z-index:-2;background:radial-gradient(circle at 18% 12%,rgba(255,255,255,.52),transparent 28%),radial-gradient(circle at 86% 86%,rgba(255,255,255,.22),transparent 30%);mix-blend-mode:overlay}
    #scene:after{content:"POP";position:absolute;right:${Math.round(-28 * scale)}px;bottom:${Math.round(-70 * scale)}px;z-index:-1;color:rgba(255,255,255,.11);font:600 ${Math.round(220 * scale)}px/.8 sans-serif;letter-spacing:-.1em;transform:rotate(-8deg)}
    ${content.css}
    #watermark{position:absolute;right:${Math.round(22 * scale)}px;bottom:${Math.round(18 * scale)}px;z-index:5;display:grid;grid-template-columns:${Math.round(31 * scale)}px auto;column-gap:${Math.round(8 * scale)}px;align-items:center;padding:${Math.round(7 * scale)}px ${Math.round(10 * scale)}px;border:1px solid rgba(255,255,255,.24);border-radius:${Math.round(12 * scale)}px;background:rgba(24,24,27,.78);color:white;text-decoration:none;font-family:sans-serif;backdrop-filter:blur(${Math.round(10 * scale)}px)}#watermark svg{grid-row:1/3;width:${Math.round(31 * scale)}px;height:${Math.round(31 * scale)}px}#watermark span{font-size:${Math.round(10 * scale)}px;font-weight:600;line-height:1.15}#watermark small{color:#d8ff52;font-size:${Math.round(8 * scale)}px;line-height:1.1}
    html.preview,html.preview body{width:100%;height:100%}
    html.preview body{display:flex;align-items:center;justify-content:center}
    html.preview #shot{width:min(100vw,${previewWidthInVh}vh);height:min(100vh,${previewHeightInVw}vw)}
  </style></head><body>
    <canvas id="shot" width="${width}" height="${height}" layoutsubtree>
      <div id="scene" drawable>${content.markup}<a id="watermark" href="${attr(site.origin)}"><svg id="devshot-watermark-mark" viewBox="0 0 64 64" fill="none"><rect x="2" y="2" width="60" height="60" rx="16" fill="#18181b"/><rect x="17" y="14" width="36" height="30" rx="7" fill="#7137ff" transform="rotate(5 35 29)"/><rect x="11" y="19" width="39" height="31" rx="8" fill="#d8ff52"/><rect x="16" y="24" width="29" height="21" rx="4" fill="#18181b"/><circle cx="22" cy="30" r="3" fill="#ff5a59"/><path d="m18 42 8-7 5 4 5-5 7 8H18Z" fill="#f7f5ee"/></svg><span>Made with DevShot</span><small>${watermarkLabel}</small></a></div>
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
      Promise.all([document.fonts.ready,source ? source.decode() : Promise.resolve()]).then(() => canvas.requestPaint());
    <\/script>
  </body></html>`;
}
