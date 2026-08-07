import { ClientGetSchema } from '#db/repositories/client/types';

const DEFAULT_REMOTE_CIDRS = '192.168.1.0/24';
const DEFAULT_ENDPOINT_IP_VERSION = 'dual';

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

    const wireGuardConfig = await WireGuard.getClientConfiguration({
      clientId,
    });
    const isFlClash = getQuery(event).format === 'flclash';

    if (!isFlClash) {
      setHeader(
        event,
        'Content-Disposition',
        `attachment; filename="${WireGuard.cleanClientFilename(client.name) || clientId}.conf"`
      );
      setHeader(event, 'Content-Type', 'application/octet-stream');
      return wireGuardConfig;
    }

    let profile: string;
    try {
      const wgInterface = await Database.interfaces.get();
      const parsedWireGuardConfig = parseWireGuardClientConfig(wireGuardConfig);
      const clientHasIpv6Tunnel =
        !WG_ENV.DISABLE_IPV6 &&
        parsedWireGuardConfig.ipv6Address !== undefined &&
        parsedWireGuardConfig.allowedIps.includes('::/0');
      const configuredCidrs = parseFlClashRemoteCidrs(
        process.env.FLCLASH_REMOTE_CIDRS ?? DEFAULT_REMOTE_CIDRS
      );
      const remoteCidrs = [
        wgInterface.ipv4Cidr,
        ...(clientHasIpv6Tunnel ? [wgInterface.ipv6Cidr] : []),
        ...configuredCidrs,
      ];
      const endpointIpVersion = parseFlClashEndpointIpVersion(
        process.env.FLCLASH_ENDPOINT_IP_VERSION ?? DEFAULT_ENDPOINT_IP_VERSION
      );

      profile = generateFlClashConfig(wireGuardConfig, {
        remoteCidrs,
        endpointIpVersion,
      });
    } catch {
      throw createError({
        statusCode: 500,
        statusMessage: 'Unable to generate FlClash configuration',
      });
    }

    const filename =
      WireGuard.cleanClientFilename(client.name) || String(clientId);
    setHeader(
      event,
      'Content-Disposition',
      `attachment; filename="${filename}-flclash.yaml"`
    );
    setHeader(event, 'Content-Type', 'application/yaml; charset=utf-8');
    setHeader(event, 'Cache-Control', 'private, no-store, max-age=0');
    setHeader(event, 'Pragma', 'no-cache');
    setHeader(event, 'Expires', '0');
    setHeader(event, 'X-Content-Type-Options', 'nosniff');
    setHeader(event, 'Referrer-Policy', 'no-referrer');
    return profile;
  }
);
