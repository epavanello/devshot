import { env } from '$env/dynamic/public';

export function getSiteUrl(): string {
  const configured = env.PUBLIC_SITE_URL?.trim();
  if (!configured) throw new Error('PUBLIC_SITE_URL is required');
  const url = new URL(configured);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('PUBLIC_SITE_URL must use http or https');
  }

  return url.origin;
}

export function getMcpUrl(): string {
  return `${getSiteUrl()}/mcp`;
}
