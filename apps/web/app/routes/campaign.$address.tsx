import { createFileRoute } from "@tanstack/react-router";
import { CampaignDetail } from "@/components/campaign/campaign-detail";

export const Route = createFileRoute("/campaign/$address")({
  component: CampaignDetailPage,
});

function CampaignDetailPage() {
  const { address } = Route.useParams();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <CampaignDetail address={address} />
    </div>
  );
}
