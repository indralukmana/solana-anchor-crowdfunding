import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";

export function WalletButton() {
  const { publicKey, disconnect, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    const short = `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`;
    return (
      <Button variant="secondary" size="sm" onClick={() => disconnect()}>
        {short}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => setVisible(true)}
      disabled={connecting}
    >
      {connecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
