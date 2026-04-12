import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getContributionPda, PROGRAM_ID } from "@crowdfunding/sdk";
import { useProgram } from "./use-program";
import type { PublicKey } from "@solana/web3.js";

export function useContribution(campaignPda: PublicKey) {
  const { publicKey } = useWallet();
  const program = useProgram();

  return useQuery({
    queryKey: ["contribution", campaignPda.toBase58(), publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) throw new Error("Wallet not connected");

      const [contribPda] = getContributionPda(campaignPda, publicKey, PROGRAM_ID);
      const account = await program.account.contribution.fetchNullable(contribPda);
      if (!account) return null;

      return {
        publicKey: contribPda,
        account,
      };
    },
    enabled: !!publicKey,
  });
}
