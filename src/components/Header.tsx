import { ConnectButton } from "@mysten/dapp-kit";
import { Flex, Heading, Text } from "@radix-ui/themes";

export function Header() {
  return (
    <Flex align="center" justify="between" style={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      padding: "16px 0",
      backdropFilter: "blur(10px)",
      background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 100%)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <Flex direction="column" gap="1">
        <Heading size="5">SuiRaffle</Heading>
        <Text size="2" color="gray">Click, pay, and you’re in.</Text>
      </Flex>

      <ConnectButton />
    </Flex>
  );
}
