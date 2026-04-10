import { createFileRoute } from "@tanstack/react-router";
import { CampaignList } from "@/components/campaign/campaign-list";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-semibold tracking-tight">
          Active Campaigns
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Support projects building on Solana.
        </p>
      </div>
      <CampaignList />
    </div>
  );
}
