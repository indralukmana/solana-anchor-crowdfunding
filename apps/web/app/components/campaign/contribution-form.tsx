import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useContribution } from "@/hooks/use-contribution";
import { useInitializeContribution, useContribute } from "@/hooks/use-transactions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContributionFormProps {
  campaignPda: PublicKey;
}

export function ContributionForm({ campaignPda }: ContributionFormProps) {
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState("");
  const { data: contribution } = useContribution(campaignPda);
  const init = useInitializeContribution();
  const contribute = useContribute();

  const isPending = init.isPending || contribute.isPending;

  if (!publicKey) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Connect your wallet to contribute.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lamports = Number(amount) * 1e9;
    if (!lamports || lamports <= 0) return;

    if (!contribution) {
      await init.mutateAsync(campaignPda);
    }
    await contribute.mutateAsync({
      campaignPda,
      amount: lamports,
    });
    setAmount("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribute</CardTitle>
        <CardDescription>
          Support this campaign with SOL.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              min="0.001"
              placeholder="1.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full shadow-sm">
            {isPending ? "Processing..." : contribution ? "Contribute" : "Initialize & Contribute"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
