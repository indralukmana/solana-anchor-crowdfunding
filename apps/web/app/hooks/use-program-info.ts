import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_ID } from "@crowdfunding/sdk";

export function useProgramInfo() {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["program-info"],
    queryFn: async () => {
      const accountInfo = await connection.getAccountInfo(PROGRAM_ID);
      return accountInfo;
    },
  });
}
