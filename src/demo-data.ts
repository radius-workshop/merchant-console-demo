import type { NetworkKey, RuntimeNetworkConfig } from './network-config.js';

export interface EndpointDefinition {
  id: string;
  label: string;
  path: string;
  method: 'GET';
  description: string;
  example: string;
  amountRaw: string;
  priceSbc: string;
  priceUsdLabel: string;
}

export const ENDPOINTS: EndpointDefinition[] = [
  {
    id: 'threat',
    label: 'Threat Intel',
    path: '/api/x402/threat/:ip',
    method: 'GET',
    description: 'Reputation, bot probability, network owner, and recent threat categories for an IP.',
    example: '/api/x402/threat/203.0.113.42',
    amountRaw: '3000',
    priceSbc: '0.003',
    priceUsdLabel: '$0.003',
  },
  {
    id: 'bot-score',
    label: 'Bot Score',
    path: '/api/x402/bot-score/:domain',
    method: 'GET',
    description: 'Machine-traffic likelihood, crawl pressure, and suggested handling for a domain.',
    example: '/api/x402/bot-score/example.com',
    amountRaw: '1000',
    priceSbc: '0.001',
    priceUsdLabel: '$0.001',
  },
  {
    id: 'reputation',
    label: 'Indicator Reputation',
    path: '/api/x402/reputation/:indicator',
    method: 'GET',
    description: 'Risk history for IPs, domains, wallet addresses, API clients, or user agents.',
    example: '/api/x402/reputation/agentfleet-17',
    amountRaw: '2000',
    priceSbc: '0.002',
    priceUsdLabel: '$0.002',
  },
  {
    id: 'url-risk',
    label: 'URL Risk',
    path: '/api/x402/url-risk?url=...',
    method: 'GET',
    description: 'Phishing, malware, brand impersonation, and automation-risk signals for a URL.',
    example: '/api/x402/url-risk?url=https%3A%2F%2Fexample.com%2Flogin',
    amountRaw: '8000',
    priceSbc: '0.008',
    priceUsdLabel: '$0.008',
  },
];

export function getEndpointDefinition(endpointId: string): EndpointDefinition {
  const endpoint = ENDPOINTS.find((item) => item.id === endpointId);
  if (!endpoint) throw new Error(`Unknown endpoint: ${endpointId}`);
  return endpoint;
}

export interface PaidPayload {
  endpoint: string;
  query: string;
  request_cost: string;
  settlement_network: string;
  settlement_network_key: NetworkKey;
  settlement_time_ms: number;
  verify_ms: number;
  settle_ms: number;
  tx_hash?: string;
  tx_explorer_url?: string;
  amount_raw: string;
  price_sbc: string;
  data: Record<string, unknown>;
}

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function pick<T>(items: T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length];
}

function score(seed: number, offset = 0): number {
  return Math.abs((seed * (offset + 17) + offset * 7919) % 101);
}

function basePayload(
  endpoint: string,
  query: string,
  networkKey: NetworkKey,
  networkConfig: RuntimeNetworkConfig,
  settlementMs: number,
  verifyMs: number,
  settleMs: number,
  txHash?: string,
): Omit<PaidPayload, 'data'> {
  const endpointDefinition = getEndpointDefinition(endpoint);
  return {
    endpoint,
    query,
    request_cost: endpointDefinition.priceUsdLabel,
    amount_raw: endpointDefinition.amountRaw,
    price_sbc: endpointDefinition.priceSbc,
    settlement_network: networkConfig.label,
    settlement_network_key: networkKey,
    settlement_time_ms: settlementMs,
    verify_ms: verifyMs,
    settle_ms: settleMs,
    ...(txHash
      ? {
          tx_hash: txHash,
          tx_explorer_url: `${networkConfig.explorerBaseUrl}/tx/${txHash}`,
        }
      : {}),
  };
}

export function buildPaidPayload(
  endpoint: string,
  query: string,
  networkKey: NetworkKey,
  networkConfig: RuntimeNetworkConfig,
  settlementMs: number,
  verifyMs: number,
  settleMs: number,
  txHash?: string,
): PaidPayload {
  const seed = hashString(`${endpoint}:${query}`);
  const countries = ['US', 'NL', 'DE', 'SG', 'BR', 'IN', 'KR', 'CA'];
  const providers = ['EdgeMeter ASN', 'Cloud VM pool', 'Residential proxy', 'Managed crawler', 'Datacenter NAT'];
  const categories = ['scanner', 'crawler', 'scraper', 'credential-stuffing', 'api-abuse', 'benign-agent'];

  if (endpoint === 'threat') {
    return {
      ...basePayload(endpoint, query, networkKey, networkConfig, settlementMs, verifyMs, settleMs, txHash),
      data: {
        ip: query,
        threat_score: score(seed),
        bot_probability: Number((score(seed, 2) / 100).toFixed(2)),
        country: pick(countries, seed),
        network_owner: pick(providers, seed, 3),
        categories: [pick(categories, seed, 1), pick(categories, seed, 4)],
        recommended_action: score(seed) > 70 ? 'charge_or_challenge' : 'allow_metered',
      },
    };
  }

  if (endpoint === 'bot-score') {
    return {
      ...basePayload(endpoint, query, networkKey, networkConfig, settlementMs, verifyMs, settleMs, txHash),
      data: {
        domain: query,
        bot_score: score(seed, 4),
        agent_share_24h: `${18 + (seed % 44)}%`,
        crawl_pressure: pick(['low', 'moderate', 'high', 'surging'], seed, 2),
        suggested_price_usd: getEndpointDefinition(endpoint).priceUsdLabel,
        suggested_policy: 'allow_x402_paid_access',
      },
    };
  }

  if (endpoint === 'reputation') {
    return {
      ...basePayload(endpoint, query, networkKey, networkConfig, settlementMs, verifyMs, settleMs, txHash),
      data: {
        indicator: query,
        reputation: pick(['trusted', 'unknown', 'watchlist', 'abusive'], seed),
        confidence: score(seed, 6),
        first_seen_days_ago: 1 + (seed % 180),
        matched_feeds: 1 + (seed % 5),
        merchant_policy: score(seed, 6) > 62 ? 'meter_and_monitor' : 'allow',
      },
    };
  }

  return {
    ...basePayload(endpoint, query, networkKey, networkConfig, settlementMs, verifyMs, settleMs, txHash),
    data: {
      url: query,
      risk_score: score(seed, 8),
      phishing_probability: Number((score(seed, 9) / 100).toFixed(2)),
      malware_seen: score(seed, 10) > 84,
      automation_pressure: pick(['normal', 'elevated', 'bursting'], seed, 5),
      recommendation: score(seed, 8) > 75 ? 'block_or_charge' : 'allow_metered',
    },
  };
}

export function baselineMetrics() {
  const now = Date.now();
  const points = Array.from({ length: 36 }, (_, i) => {
    const wave = Math.sin((i / 36) * Math.PI * 2);
    const diurnal = Math.sin((i / 36) * Math.PI);
    const agentWave = Math.cos((i / 18) * Math.PI * 2);
    const jitter = ((i * 13) % 11) - 5;
    return {
      t: now - (35 - i) * 60_000,
      human: Math.round(860 + wave * 180 + diurnal * 80 + jitter * 6),
      apiKey: Math.round(17_000 + agentWave * 2100 + diurnal * 900 + jitter * 40),
      unmonetizedAgent: Math.round(6180 + wave * 900 + diurnal * 400 + jitter * 22),
      x402: 0,
    };
  });

  return {
    humanVisitors: 1_240_000,
    apiKeyCustomers: 143,
    apiKeyRequests24h: 24_600_000,
    estimatedUnmonetizedAgentRequests24h: 8_900_000,
    totalRequests24h: 34_740_000,
    subscriptionRevenue24h: 42_800,
    agentInfrastructureCost24h: 8400,
    endpointTraffic24h: {
      threat: 3_100_000,
      'bot-score': 4_800_000,
      reputation: 700_000,
      'url-risk': 300_000,
    },
    conversionCopy: 'x402 adds a wallet-native channel for traffic that is hard to serve with API keys, invoices, or account setup.',
    series: points,
  };
}
