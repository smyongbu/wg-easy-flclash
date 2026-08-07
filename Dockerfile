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

WORKDIR /build/wg-easy-${WG_EASY_VERSION}
COPY overlays/ ./

WORKDIR /build/wg-easy-${WG_EASY_VERSION}/src
RUN pnpm install --frozen-lockfile && pnpm exec nuxt build

FROM ghcr.io/wg-easy/wg-easy:${WG_EASY_VERSION}
ARG WG_EASY_VERSION

COPY --from=web-build \
  /build/wg-easy-${WG_EASY_VERSION}/src/.output/public /app/public
COPY --from=web-build \
  /build/wg-easy-${WG_EASY_VERSION}/src/.output/server /app/server
COPY data/cn-direct-allowedips.txt \
  /usr/local/share/wg-easy-cn-direct/cn-direct-allowedips.txt

ENV CN_DIRECT_ALLOWED_IPS_FILE=/usr/local/share/wg-easy-cn-direct/cn-direct-allowedips.txt

LABEL org.opencontainers.image.title="wg-easy 国内直连配置版"
LABEL org.opencontainers.image.description="为 wg-easy 增加国内 IPv4 使用客户端本机网络的配置下载开关"
LABEL org.opencontainers.image.source="https://github.com/smyongbu/wg-easy-cn-direct"
LABEL org.opencontainers.image.licenses="AGPL-3.0-only"
