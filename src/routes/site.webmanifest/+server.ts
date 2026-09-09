import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => Response.json({
  name: 'DevShot',
  short_name: 'DevShot',
  description: 'A free, opinionated screenshot beautifier for humans and MCP agents.',
  start_url: '/',
  id: '/',
  scope: '/',
  display: 'standalone',
  display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
  theme_color: '#18181b',
  background_color: '#f7f5ee',
  icons: [
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/maskable-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ],
  categories: ['graphics', 'photo', 'utilities'],
  lang: 'en',
  dir: 'ltr'
}, { headers: {
  'content-type': 'application/manifest+json',
  'cache-control': 'public, max-age=86400'
} });
