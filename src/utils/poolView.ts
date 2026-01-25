import type { PoolData } from "../hooks/usePools";

export type PoolStatus = "Open" | "Ended" | "Sold out" | "Settled";

export function getStatus(pool: PoolData): PoolStatus {
  const now = BigInt(Date.now());
  const endedByTime = pool.endTimeMs <= now;
  const soldOut = pool.maxTickets > 0n && pool.ticketsSold >= pool.maxTickets;

  if (pool.isSettled) return "Settled";
  if (soldOut) return "Sold out";
  if (endedByTime) return "Ended";
  return "Open";
}

export function isOpen(pool: PoolData): boolean {
  return getStatus(pool) === "Open";
}

export function soldPercent(pool: PoolData): number {
  if (pool.maxTickets <= 0n) return 0;
  // clamp 0..100
  const pct = Number((pool.ticketsSold * 100n) / pool.maxTickets);
  return Math.max(0, Math.min(100, pct));
}

export function timeRemainingLabel(endTimeMs: bigint): string {
  const now = BigInt(Date.now());
  const diff = endTimeMs - now;
  if (diff <= 0n) return "Ended";

  const sec = Number(diff / 1000n);
  const minutes = Math.floor(sec / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes % 60}m left`;
  return `${minutes}m left`;
}
