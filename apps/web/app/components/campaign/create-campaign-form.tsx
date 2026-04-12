import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProfile } from "@/hooks/use-profile";
import { useCreateCampaign } from "@/hooks/use-transactions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";

export function CreateCampaignForm() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const create = useCreateCampaign();
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");

  if (!publicKey) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Connect your wallet to create a campaign.</p>
        </CardContent>
      </Card>
    );
  }

  if (profileLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">You need a creator profile first.</p>
          <Link to="/profile/create">
            <Button className="mt-4 shadow-sm">Create Profile</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goalLamports = Number(goal) * 1e9;
    const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000);
    if (!goalLamports || !deadlineTs) return;

    create.mutate(
      { goal: goalLamports, deadline: deadlineTs },
      { onSuccess: () => navigate({ to: "/" }) },
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="goal">Funding Goal (SOL)</Label>
            <Input
              id="goal"
              type="number"
              step="0.001"
              min="0.001"
              placeholder="10"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={create.isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={create.isPending}
              required
            />
          </div>
          {create.isError && (
            <p className="text-sm text-destructive">
              {create.error instanceof Error ? create.error.message : "Transaction failed"}
            </p>
          )}
          <Button type="submit" disabled={create.isPending} className="w-full shadow-sm">
            {create.isPending ? "Creating..." : "Launch Campaign"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
