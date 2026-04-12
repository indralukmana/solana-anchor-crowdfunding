import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getProfilePda, PROGRAM_ID } from "@crowdfunding/sdk";
import { useProgram } from "./use-program";
import type { PublicKey } from "@solana/web3.js";

export function useProfile(creator?: PublicKey) {
  const { publicKey } = useWallet();
  const target = creator ?? publicKey ?? undefined;
  const program = useProgram();

  return useQuery({
    queryKey: ["profile", target?.toBase58()],
    queryFn: async () => {
      if (!target) throw new Error("No creator address provided");

      const [profilePda] = getProfilePda(target, PROGRAM_ID);
      const account = await program.account.creatorProfile.fetchNullable(profilePda);
      if (!account) return null;

      return {
        publicKey: profilePda,
        account,
      };
    },
    enabled: !!target,
  });
}
