import { readFile } from 'node:fs/promises';
import isCidr from 'is-cidr';
import { ClientGetSchema } from '#db/repositories/client/types';

const CN_DIRECT_ALLOWED_IPS_FILE =
  process.env.CN_DIRECT_ALLOWED_IPS_FILE ??
  '/usr/local/share/wg-easy-cn-direct/cn-direct-allowedips.txt';

const CN_DIRECT_EXTRA_CIDRS = (
  process.env.CN_DIRECT_EXTRA_CIDRS ?? '192.168.1.0/24,10.0.8.0/24'
)
  .split(/[\s,]+/)
  .map((route) => route.trim())
  .filter(Boolean);

async function applyCnDirectProfile(config: string) {
  let rawRoutes: string;

  try {
    rawRoutes = await readFile(CN_DIRECT_ALLOWED_IPS_FILE, 'utf8');
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'CN direct route list is unavailable',
    });
  }

  const publicRoutes = rawRoutes
    .split(/[\s,]+/)
    .map((route) => route.trim())
    .filter(Boolean);

  const routes = [...new Set([...publicRoutes, ...CN_DIRECT_EXTRA_CIDRS])];

  if (
    publicRoutes.length < 100 ||
    routes.length > 20_000 ||
    routes.some((route) => isCidr(route) !== 4)
  ) {
    throw createError({
      statusCode: 503,
      statusMessage: 'CN direct route list is invalid',
    });
  }

  const profileHeader = [
    '# 国内 IPv4 使用设备自身网络',
    '# 国外 IPv4 通过 WireGuard',
    ...(CN_DIRECT_EXTRA_CIDRS.length
      ? [`# 自定义 WireGuard 网段：${CN_DIRECT_EXTRA_CIDRS.join(', ')}`]
      : []),
    '# 此配置不接管 IPv6，也不设置 DNS',
    '',
  ].join('\n');

  const withoutDns = config.replace(/^DNS\s*=.*(?:\r?\n|$)/m, '');
  const withRoutes = withoutDns.replace(
    /^AllowedIPs\s*=.*$/m,
    `AllowedIPs = ${routes.join(', ')}`
  );

  if (withRoutes === withoutDns) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to create CN direct configuration',
    });
  }

  return profileHeader + withRoutes;
}

export default definePermissionEventHandler(
  'clients',
  'view',
  async ({ event, checkPermissions }) => {
    const { clientId } = await getValidatedRouterParams(
      event,
      validateZod(ClientGetSchema, event)
    );
    const client = await Database.clients.get(clientId);
    checkPermissions(client);

    if (!client) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Client not found',
      });
    }

    const mode = getQuery(event).mode;
    let config = await WireGuard.getClientConfiguration({ clientId });
    const isCnDirect = mode === 'cn-direct';

    if (isCnDirect) {
      config = await applyCnDirectProfile(config);
    }

    setHeader(
      event,
      'Content-Disposition',
      `attachment; filename="${WireGuard.cleanClientFilename(client.name) || clientId}${isCnDirect ? '-cn-direct' : ''}.conf"`
    );

    setHeader(event, 'Content-Type', 'application/octet-stream');
    return config;
  }
);
