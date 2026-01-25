import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Flex, Heading, Text, Button, Badge } from "@radix-ui/themes";
import { useSuiClientContext } from "@mysten/dapp-kit";

import { usePools } from "../hooks/usePools";
import { getStatus, timeRemainingLabel } from "../utils/poolView";
import { mistToSui, shortAddress } from "../utils/sui";

function explorerBaseFor(network?: string) {
  if (!network) return "https://suiscan.xyz";
  if (network === "mainnet") return "https://suiscan.xyz/mainnet";
  if (network === "testnet") return "https://suiscan.xyz/testnet";
  if (network === "devnet") return "https://suiscan.xyz/devnet";
  return "https://suiscan.xyz";
}

export function RaffleDetailPage() {
  const { id } = useParams();
  const poolsQuery = usePools();
  const { network } = useSuiClientContext();
  const explorerBase = explorerBaseFor(network);

  const pool = useMemo(() => {
    if (!id) return null;
    return (poolsQuery.data ?? []).find((p) => p.id === id) ?? null;
  }, [poolsQuery.data, id]);

  if (!id) return <Text color="red">Invalid raffle id</Text>;
  if (poolsQuery.isPending) return <Text className="muted">Loading…</Text>;

  if (!pool) {
    return (
      <Flex direction="column" gap="3">
        <Heading size="6">Raffle not found</Heading>
        <Text className="muted">Pool id: {id}</Text>
        <Link to="/" style={{ textDecoration: "none" }}>
          <Button variant="soft">Back to dashboard</Button>
        </Link>
      </Flex>
    );
  }

  const status = getStatus(pool);
  const badgeColor =
    status === "Open"
      ? "green"
      : status === "Ended"
        ? "orange"
        : status === "Sold out"
          ? "red"
          : "gray";

  return (
    <Flex direction="column" gap="4">
      <Card className="hero" size="3">
        <Flex justify="between" align="start" wrap="wrap" gap="2">
          <Flex direction="column" gap="1">
            <Heading size="8" style={{ letterSpacing: "-0.02em" }}>
              Raffle Details
            </Heading>
            <Text className="muted">Pool ID: {pool.id}</Text>
          </Flex>

          <Flex gap="2" align="center" wrap="wrap">
            <Badge variant="soft" color={badgeColor as any}>
              {status}
            </Badge>

            <a
              href={`${explorerBase}/object/${pool.id}`}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button variant="soft" color="gray">
                View on explorer
              </Button>
            </a>

            <Link to="/" style={{ textDecoration: "none" }}>
              <Button variant="soft">Back</Button>
            </Link>
          </Flex>
        </Flex>
      </Card>

      <Card className="raffle-card" size="3">
        <Flex direction="column" gap="3">
          <Heading size="5">Key info</Heading>

          <Flex gap="4" wrap="wrap">
            <div>
              <Text size="2" className="muted">
                Ticket
              </Text>
              <Text weight="bold">
                {mistToSui(pool.ticketPriceMist, 4)} SUI
              </Text>
            </div>
            <div>
              <Text size="2" className="muted">
                Slots
              </Text>
              <Text weight="bold">
                {pool.ticketsSold.toString()}/{pool.maxTickets.toString()}
              </Text>
            </div>
            <div>
              <Text size="2" className="muted">
                Time
              </Text>
              <Text weight="bold">{timeRemainingLabel(pool.endTimeMs)}</Text>
            </div>
            <div>
              <Text size="2" className="muted">
                Creator
              </Text>
              <Text weight="bold">
                {pool.owner ? shortAddress(pool.owner) : "-"}
              </Text>
            </div>
          </Flex>

          {pool.isSettled && pool.winner ? (
            <Text>
              Winner:{" "}
              <Text as="span" weight="bold">
                {shortAddress(pool.winner)}
              </Text>
            </Text>
          ) : (
            <Text className="muted">
              (Next upgrade) di halaman ini kita bisa tambah participants,
              winners history (WinnerDrawn events), dan tombol “Share”.
            </Text>
          )}
        </Flex>
      </Card>
    </Flex>
  );
}
