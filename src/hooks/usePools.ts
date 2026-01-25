import { useQuery } from "@tanstack/react-query";
import { useSuiClient, useSuiClientContext } from "@mysten/dapp-kit";
import type { SuiClient, SuiMoveObject } from "@mysten/sui/client";

import {
  DEFAULT_MODULE,
  DEFAULT_PACKAGE_ID,
  poolCreatedEventType,
} from "../constants";

export type PoolData = {
  id: string;
  owner?: string;
  ticketPriceMist: bigint;
  maxTickets: bigint;
  ticketsSold: bigint;
  endTimeMs: bigint;
  isSettled: boolean;
  winner?: string | null;
  balanceMist?: bigint; // may be missing depending on RPC options
};

function asBigInt(v: unknown, fallback = 0n): bigint {
  try {
    if (typeof v === "bigint") return v;
    if (typeof v === "number") return BigInt(Math.floor(v));
    if (typeof v === "string") return BigInt(v);
    return fallback;
  } catch {
    return fallback;
  }
}

function parsePoolObject(object: any): PoolData | null {
  const data = object?.data;
  const content = data?.content as any;
  if (!content || content?.dataType !== "moveObject") return null;

  const fields = (content as SuiMoveObject).fields as any;
  const id = fields?.id?.id ?? data?.objectId;
  if (!id) return null;

  // winner field can come back in a few different shapes.
  const winnerRaw = fields?.winner;
  const winner =
    typeof winnerRaw === "string"
      ? winnerRaw
      : winnerRaw?.vec?.[0] ?? winnerRaw?.some ?? winnerRaw?.value ?? null;

  const balanceRaw = fields?.balance;
  const balanceMist = asBigInt(balanceRaw?.fields?.value ?? balanceRaw?.value);

  return {
    id,
    owner: fields?.owner,
    ticketPriceMist: asBigInt(fields?.ticket_price),
    maxTickets: asBigInt(fields?.max_tickets),
    ticketsSold: asBigInt(fields?.tickets_sold),
    endTimeMs: asBigInt(fields?.end_time),
    isSettled: Boolean(fields?.is_settled),
    winner,
    balanceMist,
  };
}

async function fetchPools(
  client: SuiClient,
  packageId: string,
  moduleName: string,
): Promise<PoolData[]> {
  // 1) Pull pool ids from events (cheap + works for shared objects)
  const events = await client.queryEvents({
    query: { MoveEventType: poolCreatedEventType(packageId, moduleName) },
    limit: 50,
    order: "descending",
  });

  const ids = Array.from(
    new Set(
      (events?.data ?? [])
        .map((e: any) => e?.parsedJson?.pool_id ?? e?.parsedJson?.poolId ?? e?.parsedJson?.id)
        .filter(Boolean)
        .map((x: any) => (typeof x === "string" ? x : x?.id ?? x?.bytes ?? x?.objectId))
        .filter(Boolean),
    ),
  ) as string[];

  if (!ids.length) return [];

  // 2) Get the latest on-chain state for each pool
  const objects = await client.multiGetObjects({
    ids,
    options: {
      showContent: true,
      showType: true,
      showOwner: true,
    },
  });

  return objects
    .map(parsePoolObject)
    .filter(Boolean)
    // newest first (best-effort)
    .sort((a, b) => Number((b!.endTimeMs ?? 0n) - (a!.endTimeMs ?? 0n))) as PoolData[];
}

export function usePools() {
  const client = useSuiClient();
  const { network } = useSuiClientContext();

  // Allow per-network override, but fall back to VITE_ vars.
  const packageId = (import.meta as any).env?.VITE_PACKAGE_ID ?? DEFAULT_PACKAGE_ID;
  const moduleName = (import.meta as any).env?.VITE_MODULE ?? DEFAULT_MODULE;

  return useQuery({
    queryKey: ["pools", network, packageId, moduleName],
    queryFn: () => fetchPools(client, packageId, moduleName),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
