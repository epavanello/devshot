import type { RequestHandler } from './$types';
import { getMcpUrl, getSiteUrl } from '$lib/config/site';

export const GET: RequestHandler = () => new Response(`# DevShot\n\nFree, deterministic screenshot beautifier for humans and MCP agents.\n\nWebsite: ${getSiteUrl()}\nMCP endpoint: ${getMcpUrl()}\nTools: beautify_screenshot, beautify_snippet, beautify_website\nAuthentication: none\nRenderer: Chrome Beta HTML-in-Canvas\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
