import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, type Wallet } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { CrowdfundingIdl, getProfilePda } from "@crowdfunding/sdk";
import { PROGRAM_ID } from "@/lib/crowdfunding/constants";
import type { Crowdfunding } from "@crowdfunding/sdk";
import type { CreatorProfile } from "@/lib/crowdfunding/types";

const dummyWallet: Wallet = {
  publicKey: PROGRAM_ID,
  signTransaction: async (t: any) => t,
  signAllTransactions: async (ts: any) => ts,
} as unknown as Wallet;

export function useProfile(creator?: PublicKey) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const target = creator ?? publicKey ?? undefined;

  return useQuery({
    queryKey: ["profile", target?.toBase58()],
    queryFn: async () => {
      if (!target) throw new Error("No creator address provided");

      const provider = new AnchorProvider(connection, dummyWallet, {
        commitment: "confirmed",
      });
      const program = new Program(CrowdfundingIdl as Crowdfunding, provider);

      const [profilePda] = getProfilePda(target, PROGRAM_ID);
      const accountInfo = await connection.getAccountInfo(profilePda);
      if (!accountInfo) return null;

      const decoded = program.coder.accounts.decode(
        "CreatorProfile",
        accountInfo.data,
      );
      return {
        publicKey: profilePda,
        account: decoded as CreatorProfile,
      };
    },
    enabled: !!target,
  });
}
