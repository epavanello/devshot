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

## Deploy on Coolify

Use the repository Docker Compose configuration rather than Nixpacks. Compose builds the included `Dockerfile`, which installs Playwright's pinned Chrome for Testing build and its Linux libraries, then runs the SvelteKit Node server as a non-root user. The image builds natively on both `amd64` and `arm64`; local development continues to use Chrome Beta by default.

In Coolify:

1. Select **Docker Compose** as the Build Pack and `/docker-compose.yaml` as its location.
2. Add `PUBLIC_SITE_URL=https://your-domain.example`.
3. Configure the public domain on the `app` service, port `3000`, and deploy.

The Compose file passes `PUBLIC_SITE_URL` to both the image build and runtime, gives Chrome a 1 GB shared-memory segment, and exposes port `3000` only to Coolify's proxy rather than publishing it directly on the host.

The Docker build fails early if `PUBLIC_SITE_URL` is missing, the packaged browser cannot start, or the experimental HTML-in-Canvas API is unavailable. The runtime health check verifies the web process; use an actual export after deployment to verify the full path through the proxy.

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
