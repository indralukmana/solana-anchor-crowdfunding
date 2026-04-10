import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatSol, formatAddress, formatDate } from "@/utils/format";
import type { Campaign } from "@/lib/crowdfunding/types";
import type { PublicKey } from "@solana/web3.js";

interface CampaignCardProps {
  campaign: { publicKey: PublicKey; account: Campaign };
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const { publicKey, account } = campaign;
  const goal = account.goal.toNumber();
  const raised = account.raised.toNumber();
  const deadline = account.deadline.toNumber();
  const percent = goal > 0 ? (raised / goal) * 100 : 0;
  const isActive = deadline * 1000 > Date.now() && !account.claimed;

  return (
    <Link to="/campaign/$address" params={{ address: publicKey.toBase58() }}>
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="line-clamp-1">
              Campaign #{account.campaignId.toString()}
            </CardTitle>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isActive ? "Active" : "Ended"}
            </span>
          </div>
          <CardDescription className="line-clamp-1">
            by {formatAddress(account.creator.toBase58())}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={raised} max={goal} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Raised
              </p>
              <p className="text-lg font-semibold">{formatSol(raised)} SOL</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Goal
              </p>
              <p className="text-lg font-semibold">{formatSol(goal)} SOL</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Deadline
              </p>
              <p className="text-sm">{formatDate(deadline)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Progress
              </p>
              <p className="text-sm font-medium">
                {percent.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
