import { createFileRoute } from "@tanstack/react-router";
import { CreateCampaignForm } from "@/components/campaign/create-campaign-form";

export const Route = createFileRoute("/create")({
  component: CreateCampaignPage,
});

function CreateCampaignPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Campaign
        </h1>
        <p className="mt-2 text-muted-foreground">
          Launch a new crowdfunding campaign.
        </p>
      </div>
      <CreateCampaignForm />
    </div>
  );
}
