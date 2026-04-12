import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateProfile } from "@/hooks/use-transactions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateProfileForm() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const create = useCreateProfile();
  const [metadataUri, setMetadataUri] = useState("");

  if (!publicKey) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Connect your wallet to create a profile.</p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metadataUri) return;
    create.mutate(metadataUri, {
      onSuccess: () => navigate({ to: "/profile" }),
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="uri">Metadata URI</Label>
            <Input
              id="uri"
              placeholder="https://... or ipfs://..."
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              disabled={create.isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              A link to your creator metadata (JSON).
            </p>
          </div>
          {create.isError && (
            <p className="text-sm text-destructive">
              {create.error instanceof Error ? create.error.message : "Transaction failed"}
            </p>
          )}
          <Button type="submit" disabled={create.isPending} className="w-full shadow-sm">
            {create.isPending ? "Creating..." : "Create Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
