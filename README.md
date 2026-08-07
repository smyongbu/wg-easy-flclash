# wg-easy 国内直连配置版

这是基于 **wg-easy v15.3.0** 的可重复构建补丁。它在客户端列表顶部增加“国内直连配置”开关，用于生成适合手机或电脑的 WireGuard 分流配置。

## 功能

- 关闭开关：下载 wg-easy 原来的普通配置；
- 开启开关：中国大陆 IPv4 使用客户端自身网络，国外 IPv4 通过 WireGuard；
- 可把局域网、WireGuard 隧道等自定义网段追加为“通过 WireGuard”；
- 国内直连配置不写入 `DNS =`，继续使用客户端自身的 DNS；
- 只改变下载的配置文件，不修改 Peer、密钥或 wg-easy 数据库；
- 配置较大，无法放进二维码，因此开启时会自动禁用二维码按钮。

> 本项目不是 wg-easy 官方版本，目前只适配 v15.3.0。

## 重要限制

1. 只处理 IPv4；IPv6 使用客户端自身网络。
2. WireGuard 按目标 IP 分流，不能精确识别应用或域名。
3. 配置约含一万条路由，部分 Android 设备导入或启用时可能较慢。
4. 不设置 DNS 可避免强制替换设备 DNS，但国外域名仍可能受本地 DNS 解析影响。
5. 路由表更新后，已经导入手机的旧配置不会自动变化，需要重新下载并导入。

## 新设备安装

### 方法一：从源码构建

```sh
git clone https://github.com/smyongbu/wg-easy-cn-direct.git
cd wg-easy-cn-direct
cp .env.example .env
sh scripts/install.sh
```

首次构建会下载 wg-easy v15.3.0 源码和构建依赖。完成后打开：

```text
http://设备IP:51821/
```

### 方法二：使用 GitHub Actions 构建的镜像

私有仓库的 GHCR 镜像需要先用拥有 `read:packages` 权限的 GitHub 令牌登录：

```sh
docker login ghcr.io
```

然后在 `.env` 中启用：

```dotenv
WG_EASY_IMAGE=ghcr.io/smyongbu/wg-easy-cn-direct:latest
```

启动：

```sh
docker compose up -d
```

GitHub Actions 会构建 `linux/amd64` 和 `linux/arm64` 镜像。

## 按设备修改网段

复制 `.env.example` 为 `.env` 后，修改：

```dotenv
CN_DIRECT_EXTRA_CIDRS=192.168.1.0/24,10.0.8.0/24
```

这些网段会和国外 IPv4 一起通过 WireGuard。第一项通常是远端局域网，第二项通常是 WireGuard 隧道网段；换设备或换网段时直接改这里，不需要修改源码。留空则不追加任何自定义网段。

## 迁移现有 wg-easy

`/etc/wireguard` 对应的数据目录包含数据库和全部密钥，迁移前必须离线备份，并确保备份不进入 Git：

1. 停止旧容器，但保留原数据目录；
2. 记录旧容器的端口、网络、能力和挂载设置；
3. 使用本项目镜像重新创建容器；
4. 把原数据目录继续挂载到 `/etc/wireguard`；
5. 设置适合该设备的 `CN_DIRECT_EXTRA_CIDRS`；
6. 确认客户端、握手和下载配置正常后，再处理旧容器。

仓库自带的 `scripts/install.sh` 发现同名容器时会停止操作，不会自动覆盖现有安装。

## 使用开关

1. 登录 wg-easy；
2. 在客户端列表顶部开启“国内直连配置”；
3. 点击目标客户端右侧的下载按钮；
4. 把下载的 `*-cn-direct.conf` 导入 WireGuard 客户端；
5. 需要普通配置时关闭开关，再重新下载。

## 路由表更新

镜像内置公开的非中国大陆 IPv4 路由表，新设备不需要额外挂载数据文件。GitHub Actions 每周自动读取 MetaCubeX 数据，重新生成、校验并构建镜像。

本地更新和校验：

```sh
node scripts/generate-cn-direct-routes.mjs
node scripts/validate-routes.mjs
```

默认数据源：

```text
https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.list
```

## 构建原理

Docker 构建会下载官方 wg-easy v15.3.0 源码，把 `overlays/` 中的 6 个补丁文件覆盖到对应路径，重新构建网页与服务端，再把结果和路由表放入官方 v15.3.0 运行镜像。仓库不复制上游完整源码，也不保存任何用户运行数据。

## 安全说明

- `.gitignore` 默认排除运行目录、数据库、WireGuard 配置、私钥、令牌和本地 `.env`；
- 不要上传 `wg-easy.db`、客户端 `.conf`、密钥、密码、Cloudflare 令牌或代理订阅；
- GitHub Actions 只使用仓库自动提供的 `GITHUB_TOKEN` 推送私有 GHCR 镜像；
- 正式迁移前仍建议手动检查待提交文件。

## 许可证

本项目及上游 wg-easy 遵循 [AGPL-3.0-only](LICENSE)，第三方来源见 [NOTICE.md](NOTICE.md)。
