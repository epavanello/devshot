import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => new Response(`# DevShot\n\nFree, deterministic screenshot beautifier for humans and MCP agents.\n\nMCP endpoint: ${url.origin}/mcp\nTool: beautify_screenshot\nAuthentication: none\nRenderer: Chrome Beta HTML-in-Canvas\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
