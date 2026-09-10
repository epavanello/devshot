# DevShot agent contract

DevShot is a free, deterministic screenshot beautifier for people and MCP agents. Preserve the shared rendering path: the web preview, HTTP export, and MCP tools must all render the Svelte scene in `src/lib/components/scene/CanvasRenderer.svelte` through HTML-in-Canvas.

## Product rules

- No authentication, accounts, database, billing, analytics, uploads, persistence or AI.
- Screenshots stay in request memory and are never written to disk.
- The product must fail clearly when HTML-in-Canvas or Chrome Beta is unavailable. Do not add a Canvas 2D, Sharp, SVG or DOM screenshot fallback.
- Keep the visual direction pop, minimal and opinionated. Avoid generic dashboards, beige SaaS styling and excessive settings.
- New visual options belong in the Zod contract in `src/lib/core/options.ts` and must work identically through UI, HTTP and MCP.
- Server rendering uses local Chrome Beta with `CanvasDrawElement` enabled.
- Keep sizing and validation framework-independent. Svelte scene components own visual markup, server modules own Chrome lifecycle, and routes only validate and translate requests.

## Validation

Run `pnpm test`, `pnpm check`, and `pnpm build`. A real render additionally requires Chrome Beta with HTML-in-Canvas enabled.

Never commit screenshots, generated output, credentials, browser profiles or build artifacts.
