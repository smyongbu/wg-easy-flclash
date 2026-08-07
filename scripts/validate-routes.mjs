import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DEFAULT_INPUT = fileURLToPath(
  new URL('../data/cn-direct-allowedips.txt', import.meta.url)
);
const inputPath = process.argv[2] ?? DEFAULT_INPUT;

function ipv4ToNumber(ip) {
  const parts = ip.split('.').map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    throw new Error(`无效的 IPv4 地址：${ip}`);
  }

  return parts[0] * 2 ** 24 + parts[1] * 2 ** 16 + parts[2] * 2 ** 8 + parts[3];
}

function parseCidr(cidr) {
  const [ip, prefixText] = cidr.split('/');
  const prefix = Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`无效的 IPv4 CIDR：${cidr}`);
  }

  const size = 2 ** (32 - prefix);
  const address = ipv4ToNumber(ip);
  const start = Math.floor(address / size) * size;
  if (address !== start) {
    throw new Error(`CIDR 不是规范的网络地址：${cidr}`);
  }

  return [start, start + size - 1];
}

function contains(intervals, ip) {
  const value = ipv4ToNumber(ip);
  return intervals.some(([start, end]) => value >= start && value <= end);
}

const raw = await readFile(inputPath, 'utf8');
const routes = raw
  .split(/\r?\n/)
  .map((route) => route.trim())
  .filter(Boolean);

if (routes.length < 1_000 || routes.length > 20_000) {
  throw new Error(`路由数量异常：${routes.length}`);
}

if (new Set(routes).size !== routes.length) {
  throw new Error('路由表包含重复条目');
}

const intervals = routes.map(parseCidr);
for (const ip of ['1.1.1.1', '8.8.8.8']) {
  if (!contains(intervals, ip)) {
    throw new Error(`预期的国外地址未包含在路由表中：${ip}`);
  }
}

for (const ip of ['10.0.0.1', '114.114.114.114', '192.168.1.1', '223.5.5.5']) {
  if (contains(intervals, ip)) {
    throw new Error(`不应通过 WireGuard 的地址出现在路由表中：${ip}`);
  }
}

console.log(`路由表校验通过，共 ${routes.length} 条 IPv4 CIDR`);
