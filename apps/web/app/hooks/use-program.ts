import { useMemo } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, type Wallet } from "@coral-xyz/anchor";
import { CrowdfundingIdl, PROGRAM_ID } from "@crowdfunding/sdk";
import type { Crowdfunding } from "@crowdfunding/sdk";

const dummyWallet: Wallet = {
  publicKey: PROGRAM_ID,
  signTransaction: async (t: any) => t,
  signAllTransactions: async (ts: any) => ts,
} as unknown as Wallet;

export function useProgram() {
  const { connection } = useConnection();

  return useMemo(() => {
    const provider = new AnchorProvider(
      connection,
      dummyWallet,
      { commitment: "confirmed" },
    );
    return new Program<Crowdfunding>(CrowdfundingIdl as Crowdfunding, provider);
  }, [connection]);
}
