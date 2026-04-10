import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, type Wallet } from "@coral-xyz/anchor";
import { CrowdfundingIdl } from "@crowdfunding/sdk";
import { PROGRAM_ID } from "@/lib/crowdfunding/constants";
import type { Crowdfunding } from "@crowdfunding/sdk";
import type { Campaign } from "@/lib/crowdfunding/types";
import type { PublicKey } from "@solana/web3.js";

const dummyWallet: Wallet = {
  publicKey: PROGRAM_ID,
  signTransaction: async (t: any) => t,
  signAllTransactions: async (ts: any) => ts,
} as unknown as Wallet;

export function useCampaigns() {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const provider = new AnchorProvider(
        connection,
        dummyWallet,
        { commitment: "confirmed" },
      );
      const program = new Program(CrowdfundingIdl as Crowdfunding, provider);

      const idlAccounts = (CrowdfundingIdl as any).accounts;
      const campaignAccount = idlAccounts.find((a: any) => a.name === "Campaign");
      if (!campaignAccount) throw new Error("Campaign account not found in IDL");

      const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: Buffer.from(campaignAccount.discriminator).toString("base64"),
            },
          },
        ],
      });

      const campaigns: { publicKey: PublicKey; account: Campaign }[] = [];
      for (const { pubkey, account } of accounts) {
        try {
          const decoded = program.coder.accounts.decode(
            "Campaign",
            account.data,
          );
          campaigns.push({ publicKey: pubkey, account: decoded as Campaign });
        } catch {
          // skip malformed
        }
      }

      return campaigns;
    },
  });
}
