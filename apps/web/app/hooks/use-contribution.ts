import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, type Wallet } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { CrowdfundingIdl, getContributionPda } from "@crowdfunding/sdk";
import { PROGRAM_ID } from "@/lib/crowdfunding/constants";
import type { Crowdfunding } from "@crowdfunding/sdk";
import type { Contribution } from "@/lib/crowdfunding/types";

const dummyWallet: Wallet = {
  publicKey: PROGRAM_ID,
  signTransaction: async (t: any) => t,
  signAllTransactions: async (ts: any) => ts,
} as unknown as Wallet;

export function useContribution(campaignPda: PublicKey) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ["contribution", campaignPda.toBase58(), publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) throw new Error("Wallet not connected");

      const provider = new AnchorProvider(
        connection,
        dummyWallet,
        { commitment: "confirmed" },
      );
      const program = new Program(CrowdfundingIdl as Crowdfunding, provider);

      const [contribPda] = getContributionPda(campaignPda, publicKey, PROGRAM_ID);
      const accountInfo = await connection.getAccountInfo(contribPda);
      if (!accountInfo) return null;

      const decoded = program.coder.accounts.decode(
        "Contribution",
        accountInfo.data,
      );
      return {
        publicKey: contribPda,
        account: decoded as Contribution,
      };
    },
    enabled: !!publicKey,
  });
}
