import { useCampaigns } from "@/hooks/use-campaigns";
import { CampaignCard } from "./campaign-card";
import { Skeleton } from "@/components/ui/skeleton";

export function CampaignList() {
  const { data: campaigns, isLoading, error } = useCampaigns();

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Failed to load campaigns.</p>
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <p className="text-lg font-medium">No campaigns yet</p>
        <p className="mt-1 text-muted-foreground">
          Be the first to launch a campaign.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((c) => (
        <CampaignCard key={c.publicKey.toBase58()} campaign={c} />
      ))}
    </div>
  );
}
