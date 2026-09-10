<div align="center">

<img src="public/favicon.svg" width="96" alt="DevShot logo">

# DevShot

### Drop the screenshot. Keep the taste.

A free, opinionated screenshot beautifier for humans and MCP agents. No AI, no account, no boring presets.

[devshot.emadev.co](https://devshot.emadev.co)

</div>

## What it does

- Single-page drag, drop and clipboard-paste editor
- Image, public website, Shiki code and terminal sources
- Pop gradient backgrounds
- Opinionated clean, browser and poster frames
- Padding, aspect ratio, drag-to-focus crop, zoom, rounded corners and shadows
- PNG or JPEG export up to 4096 px wide
- Local download and copy-as-PNG, with server rendering when the client API is unavailable
- Public Streamable HTTP MCP endpoint
- Finished image returned directly to the agent
- One rendering contract shared by preview, HTTP and MCP
- Mandatory bottom-right watermark with the official DevShot mark and website

## Experimental browser requirement

DevShot deliberately uses the WICG HTML-in-Canvas API without a fallback.

For the web preview, use Chrome Beta or Canary and enable:

```text
chrome://flags/#canvas-draw-element
```

The server launches the locally installed Chrome Beta channel with `CanvasDrawElement` enabled. If Chrome Beta is missing, export and MCP calls fail with an explicit setup error.

Install the required browser distribution with:

```sh
pnpm exec playwright install chrome-beta
```

## Run locally

```sh
pnpm install
cp .env.example .env
pnpm dev
```

`PUBLIC_SITE_URL` is required and must be the canonical public origin for the deployment. It is the single source of truth for the watermark, page metadata, agent docs and MCP URLs. For a fully local setup, use `PUBLIC_SITE_URL=http://localhost:4173`.

Open `http://localhost:4173` in Chrome Beta with the flag enabled.

## MCP

```sh
claude mcp add --transport http devshot https://devshot.emadev.co/mcp
```

Tools: `beautify_screenshot`, `beautify_snippet`, `beautify_website`

The tool accepts base64 PNG, JPEG or WebP bytes and the same visual options as the UI. It requires no token or login and returns an MCP image content block.

## Checks

```sh
pnpm test
pnpm check
pnpm build
```

MIT licensed.
