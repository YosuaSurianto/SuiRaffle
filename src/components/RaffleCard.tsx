import { Badge, Button, Card, Flex, Heading, Separator, Text } from "@radix-ui/themes";
import { ExternalLinkIcon } from "@radix-ui/react-icons";

import type { PoolData } from "../hooks/usePools";
import { mistToSui, shortAddress } from "../utils/sui";

function formatTimeRemaining(endTimeMs: bigint): { label: string; state: "open" | "ended" } {
  const now = BigInt(Date.now());
  const diff = endTimeMs - now;
  if (diff <= 0n) return { label: "Ended", state: "ended" };

  const sec = Number(diff / 1000n);
  const minutes = Math.floor(sec / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return { label: `${days}d ${hours % 24}h left`, state: "open" };
  if (hours > 0) return { label: `${hours}h ${minutes % 60}m left`, state: "open" };
  return { label: `${minutes}m left`, state: "open" };
}

export function RaffleCard({
  pool,
  explorerBase,
  onJoin,
}: {
  pool: PoolData;
  explorerBase: string;
  onJoin: (pool: PoolData) => void;
}) {
  const remaining = formatTimeRemaining(pool.endTimeMs);
  const soldPct = pool.maxTickets > 0n ? Number((pool.ticketsSold * 100n) / pool.maxTickets) : 0;

  const isClosed = pool.isSettled || remaining.state === "ended" || pool.ticketsSold >= pool.maxTickets;
  const badgeText = pool.isSettled
    ? "Settled"
    : pool.ticketsSold >= pool.maxTickets
      ? "Sold out"
      : remaining.state === "ended"
        ? "Ended"
        : "Open";

  const badgeColor = pool.isSettled ? "gray" : isClosed ? "red" : "green";

  return (
    <Card size="3" style={{
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(8px)",
    }}>
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between" gap="3">
          <Flex direction="column" gap="1">
            <Heading size="4">Raffle</Heading>
            <Text size="2" color="gray">
              by {shortAddress(pool.owner)}
            </Text>
          </Flex>
          <Badge color={badgeColor as any} variant="soft">
            {badgeText}
          </Badge>
        </Flex>

        <Separator size="4" />

        <Flex justify="between" gap="4" wrap="wrap">
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">Ticket</Text>
            <Text size="3" weight="bold">{mistToSui(pool.ticketPriceMist, 4)} SUI</Text>
          </Flex>
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">Slots</Text>
            <Text size="3" weight="bold">{pool.ticketsSold.toString()}/{pool.maxTickets.toString()}</Text>
          </Flex>
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">Time</Text>
            <Text size="3" weight="bold">{remaining.label}</Text>
          </Flex>
        </Flex>

        <div style={{
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${Math.min(100, Math.max(0, soldPct))}%`,
            background: "rgba(255,255,255,0.28)",
          }} />
        </div>

        {pool.isSettled && pool.winner ? (
          <Text size="2" color="gray">
            Winner: <Text as="span" weight="bold">{shortAddress(pool.winner)}</Text>
          </Text>
        ) : null}

        <Flex gap="2" align="center" justify="between" wrap="wrap">
          <Button disabled={isClosed} onClick={() => onJoin(pool)}>
            Join & Pay
          </Button>
          <Button
            variant="soft"
            color="gray"
            onClick={() => window.open(`${explorerBase}/object/${pool.id}`, "_blank")}
          >
            <ExternalLinkIcon /> View
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
