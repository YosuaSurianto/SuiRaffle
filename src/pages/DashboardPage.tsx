import { useMemo, useState } from "react";
import {
  Card,
  Flex,
  Heading,
  Text,
  TextField,
  Button,
  Separator,
  Spinner,
  Badge,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon, ReloadIcon } from "@radix-ui/react-icons";
import {
  useSuiClientContext,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";

import { usePools, type PoolData } from "../hooks/usePools";
import { DEFAULT_MODULE, DEFAULT_PACKAGE_ID } from "../constants";
import { getStatus, isOpen } from "../utils/poolView";
import { isUserRejectedError } from "../utils/sui";
import { RaffleCard } from "../components/RaffleCard";

const CLOCK_ID = "0x6";
const RANDOM_ID = "0x8";

function explorerBaseFor(network?: string) {
  if (!network) return "https://suiscan.xyz";
  if (network === "mainnet") return "https://suiscan.xyz/mainnet";
  if (network === "testnet") return "https://suiscan.xyz/testnet";
  if (network === "devnet") return "https://suiscan.xyz/devnet";
  return "https://suiscan.xyz";
}

export function DashboardPage() {
  const account = useCurrentAccount();
  const { network } = useSuiClientContext();
  const explorerBase = explorerBaseFor(network);

  const packageId =
    (import.meta as any).env?.VITE_PACKAGE_ID ?? DEFAULT_PACKAGE_ID;
  const moduleName = (import.meta as any).env?.VITE_MODULE ?? DEFAULT_MODULE;

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const poolsQuery = usePools();

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return poolsQuery.data ?? [];
    return (poolsQuery.data ?? []).filter(
      (p) =>
        p.id.toLowerCase().includes(s) ||
        (p.owner ?? "").toLowerCase().includes(s),
    );
  }, [poolsQuery.data, search]);

  const stats = useMemo(() => {
    const all = poolsQuery.data ?? [];
    const open = all.filter((p) => getStatus(p) === "Open").length;
    const ended = all.filter((p) => getStatus(p) !== "Open").length;
    return { total: all.length, open, ended };
  }, [poolsQuery.data]);

  async function join(pool: PoolData) {
    if (!account?.address) return toast.error("Connect wallet dulu ya 🙂");
    if (!isOpen(pool)) return toast.error("Raffle sudah tidak open.");

    const tx = new Transaction();
    const [payment] = tx.splitCoins(tx.gas, [
      tx.pure.u64(pool.ticketPriceMist),
    ]);

    tx.moveCall({
      target: `${packageId}::${moduleName}::buy_ticket`,
      arguments: [
        tx.object(pool.id),
        payment,
        tx.object(RANDOM_ID),
        tx.object(CLOCK_ID),
      ],
    });

    const promise = signAndExecute({ transaction: tx });

    toast.promise(promise, {
      loading: "Buka wallet → approve pembayaran…",
      success: (res) => {
        poolsQuery.refetch();
        const digest = (res as any)?.digest;
        return digest
          ? `Join sukses! Tx: ${digest.slice(0, 8)}…`
          : "Join sukses!";
      },
      error: (e) =>
        isUserRejectedError(e)
          ? "Pembayaran dibatalkan (reject)."
          : ((e as any)?.message ?? "Gagal join"),
      action: {
        label: "View",
        onClick: async () => {
          try {
            const res = await promise;
            const digest = (res as any)?.digest;
            if (digest) window.open(`${explorerBase}/tx/${digest}`, "_blank");
          } catch {}
        },
      },
    });

    try {
      await promise;
    } catch {}
  }

  return (
    <Flex direction="column" gap="4">
      <Card className="hero" size="3">
        <Flex direction="column" gap="2">
          <Heading size="8" style={{ letterSpacing: "-0.02em" }}>
            Dashboard
          </Heading>
          <Text size="3" className="muted">
            Explore raffle on-chain, buka detail, lalu join dengan 1 klik.
          </Text>

          <Flex gap="2" wrap="wrap" style={{ marginTop: 10 }}>
            <Badge variant="soft" color="gray">
              Total: {stats.total}
            </Badge>
            <Badge variant="soft" color="green">
              Open: {stats.open}
            </Badge>
            <Badge variant="soft" color="orange">
              Closed: {stats.ended}
            </Badge>
          </Flex>

          <Separator size="4" style={{ margin: "14px 0" }} />

          <Flex gap="2" align="center" wrap="wrap">
            <TextField.Root
              placeholder="Search by pool id / creator…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 280, flex: 1 }}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon />
              </TextField.Slot>
            </TextField.Root>

            <Button
              variant="soft"
              color="gray"
              onClick={() => poolsQuery.refetch()}
              disabled={poolsQuery.isFetching}
            >
              {poolsQuery.isFetching ? <Spinner /> : <ReloadIcon />} Refresh
            </Button>
          </Flex>
        </Flex>
      </Card>

      {poolsQuery.isPending ? (
        <Flex align="center" gap="2">
          <Spinner /> <Text className="muted">Loading pools…</Text>
        </Flex>
      ) : poolsQuery.isError ? (
        <Text color="red">
          Gagal load pools:{" "}
          {(poolsQuery.error as any)?.message ?? "Unknown error"}
        </Text>
      ) : filtered.length === 0 ? (
        <Text className="muted">
          Belum ada raffle (atau event PoolCreated belum ke-detect).
        </Text>
      ) : (
        <div className="card-grid">
          {filtered.map((pool) => (
            <RaffleCard
              key={pool.id}
              pool={pool}
              explorerBase={explorerBase}
              onJoin={join}
            />
          ))}
        </div>
      )}
    </Flex>
  );
}
