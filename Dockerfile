ARG WG_EASY_VERSION=15.3.0

FROM node:24-alpine AS web-build
ARG WG_EASY_VERSION

RUN apk add --no-cache curl tar && \
    npm install --global corepack@latest && \
    corepack enable pnpm

WORKDIR /build
RUN curl --fail --location --retry 3 \
      "https://github.com/wg-easy/wg-easy/archive/refs/tags/v${WG_EASY_VERSION}.tar.gz" \
      --output wg-easy.tar.gz && \
    tar -xzf wg-easy.tar.gz && \
    rm wg-easy.tar.gz

WORKDIR /build/wg-easy-${WG_EASY_VERSION}/src
RUN pnpm install --frozen-lockfile

WORKDIR /build/wg-easy-${WG_EASY_VERSION}
COPY overlays/ ./

WORKDIR /build/wg-easy-${WG_EASY_VERSION}/src
RUN pnpm exec prettier --check \
      "app/components/ClientCard/Config.vue" \
      "server/api/client/[clientId]/configuration.get.ts" \
      "server/utils/flClash.ts" \
      "test/unit/flClash.spec.ts" && \
    pnpm exec vitest run --project unit test/unit/flClash.spec.ts \
      --coverage.enabled=false && \
    pnpm exec eslint \
      "app/components/ClientCard/Config.vue" \
      "server/api/client/[clientId]/configuration.get.ts" \
      "server/utils/flClash.ts" \
      "test/unit/flClash.spec.ts" && \
    pnpm exec nuxt build

FROM ghcr.io/wg-easy/wg-easy:${WG_EASY_VERSION}
ARG WG_EASY_VERSION

COPY --from=web-build \
  /build/wg-easy-${WG_EASY_VERSION}/src/.output/public /app/public
COPY --from=web-build \
  /build/wg-easy-${WG_EASY_VERSION}/src/.output/server /app/server

LABEL org.opencontainers.image.title="wg-easy FlClash 分流配置版"
LABEL org.opencontainers.image.description="为 wg-easy 增加安全生成 FlClash 国内直连分流配置的下载按钮"
LABEL org.opencontainers.image.source="https://github.com/smyongbu/wg-easy-flclash"
LABEL org.opencontainers.image.licenses="AGPL-3.0-only"
