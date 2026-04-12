import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./use-program";

export function useCampaign(address: string | PublicKey) {
  const program = useProgram();
  const pubkey =
    typeof address === "string" ? new PublicKey(address) : address;

  return useQuery({
    queryKey: ["campaign", pubkey.toBase58()],
    queryFn: async () => {
      const account = await program.account.campaign.fetch(pubkey);
      return {
        publicKey: pubkey,
        account,
      };
    },
  });
}
