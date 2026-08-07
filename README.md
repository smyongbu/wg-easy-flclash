# wg-easy FlClash 分流配置版

这是基于 **wg-easy v15.3.0** 的小型定制补丁。在每个客户端原有的下载按钮旁边增加一个蓝色 **FC** 按钮，用来即时生成可导入 FlClash 的 Mihomo 配置。

本项目不是 wg-easy 官方发行版，普通 WireGuard 配置下载、二维码和客户端管理功能均保持不变。

## 生成配置的分流效果

在 FlClash 使用规则模式时：

1. 远端局域网和 WireGuard 隧道网段通过 `WG-ROUTER`；
2. 中国大陆域名和 IP 使用手机或电脑当前网络直接连接；
3. 其他流量先进入 WireGuard，再交给远端路由器上的 Mihomo/Nikki；
4. 国内 DNS 使用本地网络，境外 DNS 查询通过 WireGuard；
5. 当 WireGuard 隧道只有 IPv4 时，阻止业务 IPv6 旁路泄漏，但仍可用公网 IPv6 连接 WireGuard 服务器。

这与“大型 WireGuard AllowedIPs 路由表”不同：国内外判断由手机或电脑上的 Mihomo 完成，因此配置更小，也能按域名分流。

## 使用方法

1. 登录 wg-easy；
2. 为每台设备单独创建一个客户端；
3. 点击客户端右侧蓝色的 **FC** 按钮；
4. 把下载的 `客户端名-flclash.yaml` 导入最新版 FlClash；
5. 在 FlClash 中启用该配置并保持“规则”模式。

同一台设备不要同时启用 FlClash 和官方 WireGuard 客户端。生成文件含该客户端的 WireGuard 私钥，不能上传、分享或截图。

管理端口 `51821` 也能下载私钥配置，只能开放给可信局域网。不要把它直接映射到 WAN；需要远程管理时必须放在 HTTPS 反向代理和访问控制之后，并优先把 `WG_UI_BIND` 设为路由器的具体 LAN 地址，而不是 `0.0.0.0`。

> 配置使用 `proxy-server-nameserver-policy`，要求 FlClash 内置 Mihomo **v1.19.20 或更高版本**。

## 环境变量

复制 `.env.example` 为 `.env` 后按设备修改：

```dotenv
# 远端局域网；WireGuard 隧道网段会由 wg-easy 自动加入
FLCLASH_REMOTE_CIDRS=192.168.1.0/24

# WireGuard 域名只有 AAAA 记录时使用 ipv6；普通双栈域名使用 dual
FLCLASH_ENDPOINT_IP_VERSION=ipv6
```

`FLCLASH_REMOTE_CIDRS` 最多接受 32 个 IPv4/IPv6 CIDR，以英文逗号或空格分隔。可用端点模式为 `dual`、`ipv4`、`ipv6`、`ipv4-prefer`、`ipv6-prefer`。

如果 wg-easy 禁用了隧道 IPv6，就不能把 IPv6 远端网段填入 `FLCLASH_REMOTE_CIDRS`；生成器会拒绝不可能工作的配置，而不是静默产生错误路由。

## 新设备安装

```sh
git clone https://github.com/smyongbu/wg-easy-flclash.git
cd wg-easy-flclash
cp .env.example .env
sh scripts/install.sh
```

首次构建会下载官方 wg-easy v15.3.0 源码、运行单元测试和静态检查，再构建网页与服务端。完成后打开：

```text
http://设备IP:51821/
```

也可以使用 GitHub Actions 构建的私有 GHCR 镜像。私有镜像需要先登录：

```sh
docker login ghcr.io
docker compose up -d
```

## 迁移现有 wg-easy

`/etc/wireguard` 包含数据库和全部客户端密钥。迁移时必须继续挂载原数据目录，不能创建空目录覆盖它：

1. 记录旧容器的镜像、端口、网络、固定地址、挂载、能力和重启策略；
2. 停止旧容器，但不要删除数据目录或卷；
3. 使用本项目镜像按完全相同的运行参数重新创建容器；
4. 继续把原数据挂载到 `/etc/wireguard`；
5. 验证登录、客户端列表、普通下载、FC 下载和 WireGuard 握手；
6. 确认无误后再保留或清理旧的已停止容器。

仓库中的安装脚本发现已有同名 `wg-easy` 容器时会主动停止，不会覆盖现有密钥。

## 回退

定制镜像只替换 wg-easy 的网页和服务端程序，不改数据库格式。回退时停止定制容器，用原来的官方 `ghcr.io/wg-easy/wg-easy:15.3.0` 和原运行参数重新创建，并挂载同一份 `/etc/wireguard` 数据即可。

## 构建与测试

Docker 构建会执行：

- 补丁文件格式检查；
- FlClash 配置生成器单元测试；
- 补丁文件 ESLint 静态检查；
- wg-easy 网页与服务端构建。

GitHub Actions 会构建 `linux/amd64` 和 `linux/arm64` 镜像。构建源码和测试数据只含专用假密钥，不含任何运行中的用户配置。

## 安全设计

- 生成接口沿用 wg-easy 的客户端查看权限；
- 下载响应设置 `private, no-store`，禁止浏览器和中间缓存保存；
- 服务端不记录生成内容、密钥或客户端配置；
- 环境变量经过白名单和 CIDR 校验；
- YAML 字符串经过安全转义；
- `.gitignore` 排除运行目录、数据库、WireGuard 配置、密钥、令牌和 `.env`；
- 仓库不得提交真实的 `*.conf`、`*.yaml`、数据库、Cloudflare 令牌或代理订阅。

## 许可证

本项目及上游 wg-easy 遵循 [AGPL-3.0-only](LICENSE)，第三方项目见 [NOTICE.md](NOTICE.md)。
