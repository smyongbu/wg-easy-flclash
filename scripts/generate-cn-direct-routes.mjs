import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DEFAULT_SOURCE =
  'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.list';
const DEFAULT_OUTPUT = fileURLToPath(
  new URL('../data/cn-direct-allowedips.txt', import.meta.url)
);

const inputSource = process.argv[2] ?? DEFAULT_SOURCE;
const outputPath = process.argv[3] ?? DEFAULT_OUTPUT;
const MAX_IPV4 = 2 ** 32 - 1;

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

function numberToIpv4(value) {
  return [
    Math.floor(value / 2 ** 24) % 256,
    Math.floor(value / 2 ** 16) % 256,
    Math.floor(value / 2 ** 8) % 256,
    value % 256,
  ].join('.');
}

function cidrToInterval(cidr) {
  const [ip, prefixText] = cidr.split('/');
  const prefix = Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`无效的 IPv4 CIDR：${cidr}`);
  }

  const size = 2 ** (32 - prefix);
  const address = ipv4ToNumber(ip);
  const start = Math.floor(address / size) * size;
  return [start, start + size - 1];
}

function mergeIntervals(intervals) {
  const sorted = intervals.toSorted((a, b) => a[0] - b[0] || a[1] - b[1]);
  const result = [];

  for (const interval of sorted) {
    const previous = result.at(-1);
    if (!previous || interval[0] > previous[1] + 1) {
      result.push([...interval]);
    } else {
      previous[1] = Math.max(previous[1], interval[1]);
    }
  }

  return result;
}

function rangeToCidrs(start, end) {
  const cidrs = [];

  while (start <= end) {
    let blockSize =
      start === 0 ? 2 ** 32 : Number(BigInt(start) & -BigInt(start));
    const remaining = end - start + 1;
    while (blockSize > remaining) {
      blockSize /= 2;
    }

    const prefix = 32 - Math.log2(blockSize);
    cidrs.push(`${numberToIpv4(start)}/${prefix}`);
    start += blockSize;
  }

  return cidrs;
}

async function loadSource(source) {
  if (!/^https?:\/\//i.test(source)) {
    return readFile(source, 'utf8');
  }

  const response = await fetch(source, {
    headers: { 'user-agent': 'wg-easy-cn-direct-route-generator' },
  });
  if (!response.ok) {
    throw new Error(`下载中国 IP 列表失败：HTTP ${response.status}`);
  }
  return response.text();
}

const reservedCidrs = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.0.2.0/24',
  '192.88.99.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '198.51.100.0/24',
  '203.0.113.0/24',
  '224.0.0.0/4',
  '240.0.0.0/4',
];

const source = await loadSource(inputSource);
const chinaIpv4Cidrs = source
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => /^\d+(?:\.\d+){3}\/\d+$/.test(line));

if (chinaIpv4Cidrs.length < 1_000) {
  throw new Error('中国 IPv4 数据源条目异常，已拒绝覆盖现有路由表');
}

const exclusions = mergeIntervals(
  [...chinaIpv4Cidrs, ...reservedCidrs].map(cidrToInterval)
);
const allowedCidrs = [];
let cursor = 0;

for (const [start, end] of exclusions) {
  if (cursor < start) {
    allowedCidrs.push(...rangeToCidrs(cursor, start - 1));
  }
  cursor = Math.max(cursor, end + 1);
}

if (cursor <= MAX_IPV4) {
  allowedCidrs.push(...rangeToCidrs(cursor, MAX_IPV4));
}

await writeFile(outputPath, `${allowedCidrs.join('\n')}\n`, 'utf8');
console.log(
  `已生成 ${allowedCidrs.length} 条路由；中国 IPv4 数据源共 ${chinaIpv4Cidrs.length} 条`
);
