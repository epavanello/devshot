<div align="center">

<img src="public/favicon.svg" width="96" alt="DevShot logo">

# DevShot

### Drop the screenshot. Keep the taste.

A free, opinionated screenshot beautifier for humans and MCP agents. No AI, no account, no boring presets.

</div>

## What it does

- Single-page drag, drop and clipboard-paste editor
- Pop gradient backgrounds
- Padding, aspect ratio, crop, rounded corners and shadows
- PNG or JPEG export up to 4096 px wide
- Public Streamable HTTP MCP endpoint
- Finished image returned directly to the agent
- One rendering contract shared by preview, HTTP and MCP

## Experimental browser requirement

DevShot deliberately uses the WICG HTML-in-Canvas API without a fallback.

For the web preview, use Chrome Beta or Canary and enable:

```text
chrome://flags/#canvas-draw-element
```

The server launches the locally installed Chrome Beta channel with `CanvasDrawElement` enabled. If Chrome Beta is missing, export and MCP calls fail with an explicit setup error.

## Run locally

```sh
pnpm install
pnpm dev
```

Open `http://localhost:4173` in Chrome Beta with the flag enabled.

## MCP

```sh
claude mcp add --transport http devshot http://localhost:4173/mcp
```

Tool: `beautify_screenshot`

The tool accepts base64 PNG, JPEG or WebP bytes and the same visual options as the UI. It requires no token or login and returns an MCP image content block.

## Checks

```sh
pnpm test
pnpm check
pnpm build
```

MIT licensed.
