import { useQuery } from "@tanstack/react-query";
import { useProgram } from "./use-program";

export function useCampaigns() {
  const program = useProgram();

  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      return program.account.campaign.all();
    },
  });
}
