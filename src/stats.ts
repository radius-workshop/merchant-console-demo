import type { NetworkKey } from './network-config.js';

export interface PaidEvent {
  id: string;
  endpoint: string;
  query: string;
  network: NetworkKey;
  amountRaw: number;
  latencyMs: number;
  verifyMs: number;
  settleMs: number;
  txHash?: string;
  ts: number;
}

interface DemoStats {
  paidRequests: number;
  totalRevenueRaw: number;
  totalSettlementMs: number;
  endpointCounts: Record<string, number>;
  networkCounts: Record<NetworkKey, number>;
  events: PaidEvent[];
  startedAt: number;
}

const stats: DemoStats = {
  paidRequests: 0,
  totalRevenueRaw: 0,
  totalSettlementMs: 0,
  endpointCounts: {},
  networkCounts: { mainnet: 0, testnet: 0 },
  events: [],
  startedAt: Date.now(),
};

export function recordPaidEvent(event: Omit<PaidEvent, 'id' | 'ts'>) {
  const fullEvent: PaidEvent = {
    ...event,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ts: Date.now(),
  };

  stats.paidRequests++;
  stats.totalRevenueRaw += event.amountRaw;
  stats.totalSettlementMs += event.latencyMs;
  stats.endpointCounts[event.endpoint] = (stats.endpointCounts[event.endpoint] ?? 0) + 1;
  stats.networkCounts[event.network]++;
  stats.events.push(fullEvent);
  if (stats.events.length > 160) stats.events = stats.events.slice(-160);

  return fullEvent;
}

export function getStatsSnapshot() {
  return {
    paidRequests: stats.paidRequests,
    totalRevenueRaw: stats.totalRevenueRaw,
    totalRevenueSbc: (stats.totalRevenueRaw / 1_000_000).toFixed(6),
    averageSettlementMs:
      stats.paidRequests > 0 ? Math.round(stats.totalSettlementMs / stats.paidRequests) : 0,
    endpointCounts: stats.endpointCounts,
    networkCounts: stats.networkCounts,
    events: stats.events.slice(-60).reverse(),
    startedAt: stats.startedAt,
    uptimeMs: Date.now() - stats.startedAt,
  };
}
