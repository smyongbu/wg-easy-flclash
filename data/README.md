# 路由数据说明

`cn-direct-allowedips.txt` 是根据 MetaCubeX 公开的中国大陆 IPv4 列表计算得到的补集，并排除了私有、保留、文档和组播地址。

- 数据源：`https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.list`
- 生成：`node scripts/generate-cn-direct-routes.mjs`
- 校验：`node scripts/validate-routes.mjs`

本文件只含公开 CIDR，不含账号、密钥、订阅或设备信息。局域网及 WireGuard 隧道网段由 `CN_DIRECT_EXTRA_CIDRS` 单独配置。
