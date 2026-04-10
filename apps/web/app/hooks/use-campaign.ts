import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, type Wallet } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { CrowdfundingIdl } from "@crowdfunding/sdk";
import { PROGRAM_ID } from "@/lib/crowdfunding/constants";
import type { Crowdfunding } from "@crowdfunding/sdk";
import type { Campaign } from "@/lib/crowdfunding/types";

const dummyWallet: Wallet = {
  publicKey: PROGRAM_ID,
  signTransaction: async (t: any) => t,
  signAllTransactions: async (ts: any) => ts,
} as unknown as Wallet;

export function useCampaign(address: string | PublicKey) {
  const { connection } = useConnection();
  const pubkey =
    typeof address === "string" ? new PublicKey(address) : address;

  return useQuery({
    queryKey: ["campaign", pubkey.toBase58()],
    queryFn: async () => {
      const provider = new AnchorProvider(
        connection,
        dummyWallet,
        { commitment: "confirmed" },
      );
      const program = new Program(CrowdfundingIdl as Crowdfunding, provider);

      const accountInfo = await connection.getAccountInfo(pubkey);
      if (!accountInfo) throw new Error("Campaign not found");

      const decoded = program.coder.accounts.decode(
        "Campaign",
        accountInfo.data,
      );
      return {
        publicKey: pubkey,
        account: decoded as Campaign,
      };
    },
  });
}
