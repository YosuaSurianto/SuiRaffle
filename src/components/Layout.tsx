import { Link, NavLink, Outlet } from "react-router-dom";
import { Badge, Button, Flex, Text } from "@radix-ui/themes";
import {
  ConnectButton,
  useCurrentAccount,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { shortAddress } from "../utils/sui";

function explorerBaseFor(network?: string) {
  if (!network) return "https://suiscan.xyz";
  if (network === "mainnet") return "https://suiscan.xyz/mainnet";
  if (network === "testnet") return "https://suiscan.xyz/testnet";
  if (network === "devnet") return "https://suiscan.xyz/devnet";
  return "https://suiscan.xyz";
}

export function Layout() {
  const account = useCurrentAccount();
  const { network } = useSuiClientContext();
  const explorerBase = explorerBaseFor(network);

  return (
    <div>
      <div className="topbar">
        <div className="shell-inner">
          <Flex align="center" justify="between" gap="3" wrap="wrap">
            <Flex align="center" gap="3">
              <Link to="/" style={{ textDecoration: "none" }}>
                <Flex direction="column" style={{ lineHeight: 1 }}>
                  <Text weight="bold" size="4">
                    SuiRaffle
                  </Text>
                  <Text size="2" className="muted">
                    Click, pay, and you’re in.
                  </Text>
                </Flex>
              </Link>

              <Flex gap="2" wrap="wrap">
                <NavLink to="/" style={{ textDecoration: "none" }}>
                  {({ isActive }) => (
                    <Button variant={isActive ? "solid" : "soft"}>
                      Dashboard
                    </Button>
                  )}
                </NavLink>

                <NavLink to="/create" style={{ textDecoration: "none" }}>
                  {({ isActive }) => (
                    <Button variant={isActive ? "solid" : "soft"}>
                      Create
                    </Button>
                  )}
                </NavLink>
              </Flex>
            </Flex>

            <Flex align="center" gap="2" wrap="wrap">
              <Badge variant="soft" color="gray">
                Network: {network ?? "-"}
              </Badge>

              {account?.address ? (
                <a
                  href={`${explorerBase}/address/${account.address}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <span className="pill">
                    <Text size="2" weight="bold">
                      {shortAddress(account.address)}
                    </Text>
                  </span>
                </a>
              ) : null}

              <ConnectButton />
            </Flex>
          </Flex>
        </div>
      </div>

      <div
        className="shell-inner"
        style={{ paddingTop: 22, paddingBottom: 64 }}
      >
        <Outlet />
      </div>
    </div>
  );
}
