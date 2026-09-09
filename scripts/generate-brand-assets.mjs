#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const publicDir = resolve(root, 'public');
const masterPath = resolve(root, 'src/lib/brand/devshot-mark.svg');

const render = (svg, size) => new Resvg(svg, {
  fitTo: { mode: 'width', value: size }
}).render().asPng();

const safeIcon = (svg) => {
  const encoded = Buffer.from(svg).toString('base64');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#18181b"/><image href="data:image/svg+xml;base64,${encoded}" x="7" y="7" width="50" height="50"/></svg>`;
};

function ico(images) {
  const headerSize = 6 + images.length * 16;
  const output = Buffer.alloc(headerSize + images.reduce((sum, image) => sum + image.png.length, 0));
  output.writeUInt16LE(0, 0);
  output.writeUInt16LE(1, 2);
  output.writeUInt16LE(images.length, 4);

  let offset = headerSize;
  images.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    output.writeUInt8(size, entry);
    output.writeUInt8(size, entry + 1);
    output.writeUInt16LE(1, entry + 4);
    output.writeUInt16LE(32, entry + 6);
    output.writeUInt32LE(png.length, entry + 8);
    output.writeUInt32LE(offset, entry + 12);
    Buffer.from(png).copy(output, offset);
    offset += png.length;
  });

  return output;
}

const master = await readFile(masterPath, 'utf8');
const safeMaster = safeIcon(master);
const faviconPngs = [16, 32, 48].map((size) => ({ size, png: render(master, size) }));
const outputs = [
  { path: resolve(publicDir, 'favicon.svg'), bytes: Buffer.from(master) },
  ...faviconPngs.slice(0, 2).map(({ size, png }) => ({ path: resolve(publicDir, `favicon-${size}.png`), bytes: png })),
  { path: resolve(publicDir, 'favicon.ico'), bytes: ico(faviconPngs) },
  { path: resolve(publicDir, 'apple-touch-icon.png'), bytes: render(safeMaster, 180) },
  { path: resolve(publicDir, 'icon-192.png'), bytes: render(master, 192) },
  { path: resolve(publicDir, 'icon-512.png'), bytes: render(master, 512) },
  { path: resolve(publicDir, 'maskable-icon-192.png'), bytes: render(safeMaster, 192) },
  { path: resolve(publicDir, 'maskable-icon-512.png'), bytes: render(safeMaster, 512) }
];

let stale = 0;
for (const output of outputs) {
  let current = null;
  try {
    current = await readFile(output.path);
  } catch {
    // Missing assets are generated or reported below.
  }

  if (current && Buffer.from(current).equals(Buffer.from(output.bytes))) continue;
  const label = output.path.replace(`${root}/`, '');

  if (checkOnly) {
    console.error(`✗ ${label} is out of date`);
    stale += 1;
    continue;
  }

  await mkdir(dirname(output.path), { recursive: true });
  await writeFile(output.path, output.bytes);
  console.log(`✓ ${label}`);
}

if (checkOnly && stale) process.exitCode = 1;
if (checkOnly && !stale) console.log('✓ brand assets match the master SVG');
