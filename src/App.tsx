import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {
  Badge,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Separator,
  Spinner,
  Tabs,
  Text,
  TextField,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Toaster, toast } from "sonner";
import { useMemo, useState } from "react";

import { DEFAULT_MODULE, DEFAULT_PACKAGE_ID } from "./constants";
import { Header } from "./components/Header";
import { RaffleCard } from "./components/RaffleCard";
import { usePools } from "./hooks/usePools";
import { isUserRejectedError, shortAddress, suiToMist } from "./utils/sui";

function explorerBaseFor(network?: string) {
  // Suiscan supports network prefixes like /testnet, /devnet, /mainnet.
  // For unknown networks, fall back to root.
  if (!network) return "https://suiscan.xyz";
  if (network === "mainnet") return "https://suiscan.xyz/mainnet";
  if (network === "testnet") return "https://suiscan.xyz/testnet";
  if (network === "devnet") return "https://suiscan.xyz/devnet";
  return "https://suiscan.xyz";
}

export default function App() {
  const account = useCurrentAccount();
  const { network } = useSuiClientContext();
  const explorerBase = explorerBaseFor(network);

  // Env-driven config (works well on Vercel).
  const packageId = (import.meta as any).env?.VITE_PACKAGE_ID ?? DEFAULT_PACKAGE_ID;
  const moduleName = (import.meta as any).env?.VITE_MODULE ?? DEFAULT_MODULE;

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const poolsQuery = usePools();

  const [search, setSearch] = useState("");
  const filteredPools = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return poolsQuery.data ?? [];
    return (poolsQuery.data ?? []).filter((p) => p.id.toLowerCase().includes(s) || (p.owner ?? "").toLowerCase().includes(s));
  }, [poolsQuery.data, search]);

  // --- Create raffle form ---
  const [ticketPriceSui, setTicketPriceSui] = useState("0.1");
  const [maxTickets, setMaxTickets] = useState("100");
  const [endAt, setEndAt] = useState(() => {
    // Default: 1 hour from now.
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n: number) => `${n}`.padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  async function createPool() {
    if (!account?.address) {
      toast.error("Connect wallet dulu ya 🙂");
      return;
    }

    const priceMist = suiToMist(ticketPriceSui);
    const max = BigInt(maxTickets || "0");
    const endMs = BigInt(new Date(endAt).getTime());

    if (priceMist <= 0n) {
      toast.error("Ticket price harus > 0");
      return;
    }
    if (max <= 0n) {
      toast.error("Max tickets harus > 0");
      return;
    }
    if (endMs <= BigInt(Date.now())) {
      toast.error("End time harus di masa depan");
      return;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${moduleName}::create_pool`,
      arguments: [tx.pure.u64(priceMist), tx.pure.u64(max), tx.pure.u64(endMs)],
    });

    const promise = signAndExecute({
      transaction: tx,
    });

    toast.promise(promise, {
      loading: "Buka wallet → approve transaksi create raffle…",
      success: (res) => {
        poolsQuery.refetch();
        const digest = (res as any)?.digest;
        return digest ? `Raffle created! Tx: ${digest.slice(0, 8)}…` : "Raffle created!";
      },
      error: (e) => (isUserRejectedError(e) ? "Transaksi dibatalkan (reject)." : (e as any)?.message ?? "Gagal create raffle"),
      action: {
        label: "View",
        onClick: async () => {
          try {
            const res = await promise;
            const digest = (res as any)?.digest;
            if (digest) window.open(`${explorerBase}/tx/${digest}`, "_blank");
          } catch {
            // ignore
          }
        },
      },
    });

    try {
      await promise;
    } catch {
      // error already surfaced in toast
    }
  }

  async function joinPool(poolId: string, ticketPriceMist: bigint) {
    if (!account?.address) {
      toast.error("Connect wallet dulu ya 🙂");
      return;
    }

    const CLOCK_ID = "0x6";
    const RANDOM_ID = "0x8";

    const tx = new Transaction();
    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(ticketPriceMist)]);

    tx.moveCall({
      target: `${packageId}::${moduleName}::buy_ticket`,
      arguments: [
        tx.object(poolId),
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
    <Container className="app-container" size="4" style={{ paddingBottom: 64 }}>
      <Toaster richColors closeButton />

      <Header />

      <Flex direction="column" gap="6" style={{ paddingTop: 24 }}>
        <Flex direction="column" gap="2">
          <Heading size="8" style={{ letterSpacing: "-0.02em" }}>
            Raffle on Sui.
          </Heading>
          <Text size="3" color="gray">
            Player tinggal klik <Text as="span" weight="bold">Join & Pay</Text> — nggak perlu copas ObjectID dari explorer.
          </Text>
          <Flex gap="2" wrap="wrap" align="center" style={{ marginTop: 8 }}>
            <Badge variant="soft" color="gray">
              Network: {network ?? "-"}
            </Badge>
            <Badge variant="soft" color="gray">
              Package: {shortAddress(packageId, 6)}
            </Badge>
          </Flex>
        </Flex>

        <Tabs.Root defaultValue="explore">
          <Tabs.List>
            <Tabs.Trigger value="explore">Explore</Tabs.Trigger>
            <Tabs.Trigger value="create">Create</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="explore" style={{ paddingTop: 18 }}>
            <Card size="3" style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <Flex align="center" justify="between" gap="3" wrap="wrap">
                <Flex direction="column" gap="1">
                  <Heading size="5">All raffles</Heading>
                  <Text size="2" color="gray">Auto dari on-chain events → data pool paling baru.</Text>
                </Flex>

                <Flex gap="2" align="center" wrap="wrap">
                  <TextField.Root
                    placeholder="Search by pool id / creator…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ minWidth: 260 }}
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

              <Separator size="4" style={{ margin: "16px 0" }} />

              {poolsQuery.isPending ? (
                <Flex align="center" gap="2" style={{ padding: 12 }}>
                  <Spinner /> <Text color="gray">Loading pools…</Text>
                </Flex>
              ) : poolsQuery.isError ? (
                <Text color="red">
                  Gagal load pools: {(poolsQuery.error as any)?.message ?? "Unknown error"}
                </Text>
              ) : filteredPools.length === 0 ? (
                <Text color="gray">Belum ada raffle (atau belum ada event PoolCreated yang ke-detect).</Text>
              ) : (
                <div className="card-grid" style={{ marginTop: 12 }}>
                  {filteredPools.map((pool) => (
                    <RaffleCard
                      key={pool.id}
                      pool={pool}
                      explorerBase={explorerBase}
                      onJoin={(p) => joinPool(p.id, p.ticketPriceMist)}
                    />
                  ))}
                </div>
              )}
            </Card>
          </Tabs.Content>

          <Tabs.Content value="create" style={{ paddingTop: 18 }}>
            <Card size="3" style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Heading size="5">Create raffle</Heading>
                  <Text size="2" color="gray">
                    Input harga tiket dalam SUI (bukan MIST). Semua data akan ke-chain.
                  </Text>
                </Flex>

                <Flex gap="3" wrap="wrap">
                  <Flex direction="column" gap="2" style={{ minWidth: 240, flex: 1 }}>
                    <Text size="2" color="gray">Ticket price (SUI)</Text>
                    <TextField.Root
                      value={ticketPriceSui}
                      onChange={(e) => setTicketPriceSui(e.target.value)}
                      placeholder="0.1"
                    />
                  </Flex>

                  <Flex direction="column" gap="2" style={{ minWidth: 240, flex: 1 }}>
                    <Text size="2" color="gray">Max tickets</Text>
                    <TextField.Root
                      value={maxTickets}
                      onChange={(e) => setMaxTickets(e.target.value)}
                      placeholder="100"
                    />
                  </Flex>

                  <Flex direction="column" gap="2" style={{ minWidth: 260, flex: 1 }}>
                    <Text size="2" color="gray">End time</Text>
                    <TextField.Root
                      type="datetime-local"
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                    />
                  </Flex>
                </Flex>

                <Flex align="center" justify="between" wrap="wrap" gap="3">
                  <Text size="2" color="gray">
                    Creator: {account?.address ? shortAddress(account.address) : "-"}
                  </Text>

                  <Button onClick={createPool}>Create raffle</Button>
                </Flex>
              </Flex>
            </Card>
          </Tabs.Content>
        </Tabs.Root>
      </Flex>
    </Container>
  );
}
