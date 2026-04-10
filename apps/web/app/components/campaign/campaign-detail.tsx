import { Link } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCampaign } from "@/hooks/use-campaign";
import { useContribution } from "@/hooks/use-contribution";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSol, formatAddress, formatDate } from "@/utils/format";
import { ContributionForm } from "./contribution-form";
import { useWithdraw, useRefund } from "@/hooks/use-transactions";

interface CampaignDetailProps {
  address: string;
}

export function CampaignDetail({ address }: CampaignDetailProps) {
  const { publicKey } = useWallet();
  const { data: campaign, isLoading, error } = useCampaign(address);
  const { data: contribution } = useContribution(
    new PublicKey(address),
  );
  const { data: profile } = useProfile(campaign?.account.creator);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Campaign not found.</p>
      </div>
    );
  }

  const { publicKey: campaignPk, account } = campaign;
  const goal = account.goal.toNumber();
  const raised = account.raised.toNumber();
  const deadline = account.deadline.toNumber();
  const percent = goal > 0 ? (raised / goal) * 100 : 0;
  const isEnded = deadline * 1000 <= Date.now();
  const isGoalReached = raised >= goal;
  const isCreator = publicKey?.equals(account.creator);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Campaign #{account.campaignId.toString()}
        </h1>
        <p className="mt-1 text-muted-foreground">
          by{" "}
          {profile?.account.metadataUri ? (
            <span className="font-medium text-foreground">
              {profile.account.metadataUri}
            </span>
          ) : (
            formatAddress(account.creator.toBase58())
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>
            {isEnded
              ? isGoalReached
                ? "Goal reached — campaign ended"
                : "Goal not reached — campaign ended"
              : `${formatDate(deadline)} remaining`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={raised} max={goal} />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Raised
              </p>
              <p className="text-xl font-semibold">{formatSol(raised)} SOL</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Goal
              </p>
              <p className="text-xl font-semibold">{formatSol(goal)} SOL</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Deadline
              </p>
              <p className="text-sm">{formatDate(deadline)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Your Contribution
              </p>
              <p className="text-xl font-semibold">
                {contribution
                  ? `${formatSol(contribution.account.amount)} SOL`
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isCreator && isEnded && isGoalReached && !account.claimed && (
        <Card>
          <CardHeader>
            <CardTitle>Withdraw Funds</CardTitle>
            <CardDescription>
              Withdraw all raised funds to your wallet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WithdrawButton campaignPda={campaignPk} />
          </CardContent>
        </Card>
      )}

      {isCreator && isEnded && !isGoalReached && (
        <Card>
          <CardHeader>
            <CardTitle>Refund Donors</CardTitle>
            <CardDescription>
              Campaign did not reach its goal. Donors can request refunds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Donors can refund their contributions from their own wallet.
            </p>
          </CardContent>
        </Card>
      )}

      {!isEnded && !isCreator && publicKey && (
        <ContributionForm campaignPda={campaignPk} />
      )}

      {isEnded && !isGoalReached && contribution && (
        <Card>
          <CardHeader>
            <CardTitle>Request Refund</CardTitle>
            <CardDescription>
              Reclaim your contribution from this ended campaign.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RefundButton campaignPda={campaignPk} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WithdrawButton({ campaignPda }: { campaignPda: PublicKey }) {
  const { mutate, isPending } = useWithdraw();

  return (
    <Button
      onClick={() => mutate(campaignPda)}
      disabled={isPending}
      className="shadow-sm"
    >
      {isPending ? "Withdrawing..." : "Withdraw"}
    </Button>
  );
}

function RefundButton({ campaignPda }: { campaignPda: PublicKey }) {
  const { mutate, isPending } = useRefund();

  return (
    <Button
      variant="outline"
      onClick={() => mutate(campaignPda)}
      disabled={isPending}
      className="shadow-sm"
    >
      {isPending ? "Processing..." : "Request Refund"}
    </Button>
  );
}
