# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS dependencies

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder

ARG PUBLIC_SITE_URL
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL

COPY . .
RUN test -n "$PUBLIC_SITE_URL" || (echo "PUBLIC_SITE_URL is required at build time" >&2; exit 1)
RUN pnpm build

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV BODY_SIZE_LIMIT=32M
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

ARG PUBLIC_SITE_URL
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV ORIGIN=$PUBLIC_SITE_URL

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --prod --frozen-lockfile \
  && pnpm exec playwright install --with-deps chrome-beta \
  && apt-get update \
  && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/* \
  && pnpm store prune

RUN node --input-type=module -e "import { chromium } from 'playwright'; const browser = await chromium.launch({ channel: 'chrome-beta', headless: true, args: ['--enable-features=CanvasDrawElement'] }); const page = await browser.newPage(); const supported = await page.evaluate(() => 'drawElementImage' in CanvasRenderingContext2D.prototype && 'requestPaint' in HTMLCanvasElement.prototype); await browser.close(); if (!supported) throw new Error('Chrome Beta does not expose HTML-in-Canvas');"

COPY --from=builder --chown=node:node /app/build ./build

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "build"]
