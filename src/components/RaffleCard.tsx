import { Badge, Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { Link } from "react-router-dom";

import type { PoolData } from "../hooks/usePools";
import { mistToSui, shortAddress } from "../utils/sui";
import {
  getStatus,
  soldPercent,
  timeRemainingLabel,
  isOpen,
} from "../utils/poolView";

export function RaffleCard({
  pool,
  explorerBase,
  onJoin,
}: {
  pool: PoolData;
  explorerBase: string;
  onJoin: (pool: PoolData) => void;
}) {
  const status = getStatus(pool);
  const pct = soldPercent(pool);
  const timeLabel = timeRemainingLabel(pool.endTimeMs);

  const badgeColor =
    status === "Open"
      ? "green"
      : status === "Ended"
        ? "orange"
        : status === "Sold out"
          ? "red"
          : "gray";

  return (
    <Card className="raffle-card" size="3">
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between" gap="2">
          <Flex direction="column" gap="1">
            <Heading size="4">Raffle</Heading>
            <Text size="2" className="muted">
              by {shortAddress(pool.owner)}
            </Text>
          </Flex>

          <Badge color={badgeColor as any} variant="soft">
            {status}
          </Badge>
        </Flex>

        <Flex justify="between" gap="4" wrap="wrap">
          <Flex direction="column" gap="1">
            <Text size="2" className="muted">
              Ticket
            </Text>
            <Text size="4" weight="bold">
              {mistToSui(pool.ticketPriceMist, 4)} SUI
            </Text>
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" className="muted">
              Slots
            </Text>
            <Text size="4" weight="bold">
              {pool.ticketsSold.toString()}/{pool.maxTickets.toString()}
            </Text>
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" className="muted">
              Time
            </Text>
            <Text size="4" weight="bold">
              {timeLabel}
            </Text>
          </Flex>
        </Flex>

        <div className="progress" aria-label="progress">
          <div style={{ width: `${pct}%` }} />
        </div>

        {pool.isSettled && pool.winner ? (
          <Text size="2" className="muted">
            Winner:{" "}
            <Text as="span" weight="bold">
              {shortAddress(pool.winner)}
            </Text>
          </Text>
        ) : null}

        <Flex gap="2" align="center" justify="between" wrap="wrap">
          <Button disabled={!isOpen(pool)} onClick={() => onJoin(pool)}>
            Join & Pay
          </Button>

          <Flex gap="2" wrap="wrap">
            <Link to={`/raffle/${pool.id}`} style={{ textDecoration: "none" }}>
              <Button variant="soft" color="gray">
                Details
              </Button>
            </Link>

            <Button
              variant="soft"
              color="gray"
              onClick={() =>
                window.open(`${explorerBase}/object/${pool.id}`, "_blank")
              }
            >
              <ExternalLinkIcon /> Explorer
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}
