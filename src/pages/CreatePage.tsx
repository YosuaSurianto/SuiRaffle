import { useState } from "react";
import { Card, Flex, Heading, Text, TextField, Button } from "@radix-ui/themes";
import { toast } from "sonner";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

import { DEFAULT_MODULE, DEFAULT_PACKAGE_ID } from "../constants";
import { isUserRejectedError, shortAddress, suiToMist } from "../utils/sui";

const CLOCK_ID = "0x6";

function explorerBaseFor(network?: string) {
  if (!network) return "https://suiscan.xyz";
  if (network === "mainnet") return "https://suiscan.xyz/mainnet";
  if (network === "testnet") return "https://suiscan.xyz/testnet";
  if (network === "devnet") return "https://suiscan.xyz/devnet";
  return "https://suiscan.xyz";
}

export function CreatePage() {
  const account = useCurrentAccount();
  const { network } = useSuiClientContext();
  const explorerBase = explorerBaseFor(network);

  const packageId =
    (import.meta as any).env?.VITE_PACKAGE_ID ?? DEFAULT_PACKAGE_ID;
  const moduleName = (import.meta as any).env?.VITE_MODULE ?? DEFAULT_MODULE;

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [ticketPriceSui, setTicketPriceSui] = useState("0.1");
  const [maxTickets, setMaxTickets] = useState("100");
  const [numWinners, setNumWinners] = useState("1");
  const [durationHours, setDurationHours] = useState("24");

  async function createPool() {
    if (!account?.address) return toast.error("Connect wallet dulu ya 🙂");

    const priceMist = suiToMist(ticketPriceSui);
    const max = BigInt(maxTickets || "0");
    const winners = BigInt(numWinners || "0");
    const hours = BigInt(durationHours || "0");

    if (priceMist <= 0n) return toast.error("Ticket price harus > 0");
    if (max <= 0n) return toast.error("Max tickets harus > 0");
    if (winners <= 0n) return toast.error("Num winners harus > 0");
    if (winners > max)
      return toast.error("Num winners tidak boleh lebih dari max tickets");
    if (hours <= 0n) return toast.error("Duration hours harus > 0");

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${moduleName}::create_pool`,
      arguments: [
        tx.pure.u64(priceMist),
        tx.pure.u64(max),
        tx.pure.u64(winners),
        tx.pure.u64(hours),
        tx.object(CLOCK_ID),
      ],
    });

    const promise = signAndExecute({ transaction: tx });

    toast.promise(promise, {
      loading: "Buka wallet → approve create raffle…",
      success: (res) => {
        const digest = (res as any)?.digest;
        return digest
          ? `Raffle created! Tx: ${digest.slice(0, 8)}…`
          : "Raffle created!";
      },
      error: (e) =>
        isUserRejectedError(e)
          ? "Transaksi dibatalkan (reject)."
          : ((e as any)?.message ?? "Gagal create raffle"),
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
        <Flex direction="column" gap="1">
          <Heading size="8" style={{ letterSpacing: "-0.02em" }}>
            Create Raffle
          </Heading>
          <Text className="muted">
            Bikin raffle baru on-chain (signature sudah sesuai Move).
          </Text>
        </Flex>
      </Card>

      <Card className="raffle-card" size="3">
        <Flex direction="column" gap="4">
          <Flex gap="3" wrap="wrap">
            <Flex direction="column" gap="2" style={{ minWidth: 220, flex: 1 }}>
              <Text size="2" className="muted">
                Ticket price (SUI)
              </Text>
              <TextField.Root
                value={ticketPriceSui}
                onChange={(e) => setTicketPriceSui(e.target.value)}
                placeholder="0.1"
              />
            </Flex>

            <Flex direction="column" gap="2" style={{ minWidth: 220, flex: 1 }}>
              <Text size="2" className="muted">
                Max tickets
              </Text>
              <TextField.Root
                value={maxTickets}
                onChange={(e) => setMaxTickets(e.target.value)}
                placeholder="100"
              />
            </Flex>

            <Flex direction="column" gap="2" style={{ minWidth: 220, flex: 1 }}>
              <Text size="2" className="muted">
                Num winners
              </Text>
              <TextField.Root
                value={numWinners}
                onChange={(e) => setNumWinners(e.target.value)}
                placeholder="1"
              />
            </Flex>

            <Flex direction="column" gap="2" style={{ minWidth: 220, flex: 1 }}>
              <Text size="2" className="muted">
                Duration (hours)
              </Text>
              <TextField.Root
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="24"
              />
            </Flex>
          </Flex>

          <Flex align="center" justify="between" wrap="wrap" gap="3">
            <Text size="2" className="muted">
              Creator: {account?.address ? shortAddress(account.address) : "-"}
            </Text>
            <Button onClick={createPool}>Create raffle</Button>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
