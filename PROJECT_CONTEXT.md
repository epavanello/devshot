# DevShot product context

DevShot is the small, free sibling of DevMotion and DevPost. It turns raw screenshots into finished shareable images through one focused single-page editor and one public MCP tool.

The differentiator is not AI. It is deterministic taste: a short set of strong background presets, useful spacing, deliberate shadows, crop control, rounded corners and export resolutions that look good immediately.

## Primary experience

1. Drop, choose or paste a PNG, JPEG or WebP screenshot.
2. See it rendered inside an HTML-in-Canvas scene.
3. Choose a background, ratio, fit, padding, radius, shadow and output width.
4. Download the rendered image.

The first viewport is the editor. Marketing copy stays secondary. No account or setup may stand between the screenshot and the canvas.

## Agent experience

An MCP client connects to `/mcp` without authentication and calls `beautify_screenshot` with base64 image bytes plus the same options exposed by the UI. The result includes the finished image directly in the tool response.

## Rendering decision

DevShot intentionally targets the experimental WICG HTML-in-Canvas proposal. Preview and export require `drawElementImage`; there is no compatibility fallback. Browser exports run through a persistent local Chrome Beta instance launched with `CanvasDrawElement` enabled. This lets future versions send DOM snapshots into Canvas 2D, WebGL or WebGPU effects without changing the product contract.

## Scope

Inside: single image composition, deterministic presets, local headless rendering, direct download, public MCP, type validation and concise agent documentation.

Outside: AI enhancement, screenshot capture from URLs, batch history, cloud storage, accounts, teams, templates marketplace, editing annotations and billing.
