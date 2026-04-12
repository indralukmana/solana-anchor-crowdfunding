import { Link } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProfile } from "@/hooks/use-profile";
import { useUpdateProfile } from "@/hooks/use-transactions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress } from "@/utils/format";
import { useState } from "react";

export function ProfileCard() {
  const { publicKey } = useWallet();
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [metadataUri, setMetadataUri] = useState("");

  if (!publicKey) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Connect your wallet to view your profile.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No profile found.</p>
          <Link to="/profile/create">
            <Button className="mt-4 shadow-sm">Create Profile</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metadataUri) return;
    update.mutate(metadataUri, {
      onSuccess: () => {
        setEditing(false);
        setMetadataUri("");
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{formatAddress(publicKey.toBase58())}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Metadata URI</p>
            <p className="mt-1 break-all text-sm">{profile.account.metadataUri}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Campaigns Launched</p>
            <p className="mt-1 text-lg font-semibold">{profile.account.campaignCount.toString()}</p>
          </div>
        </CardContent>
      </Card>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uri">New Metadata URI</Label>
                <Input
                  id="uri"
                  placeholder="https://..."
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                  disabled={update.isPending}
                  required
                />
              </div>
              <div className="flex gap-3">
              {update.isError && (
                <p className="text-sm text-destructive">
                  {update.error instanceof Error ? update.error.message : "Transaction failed"}
                </p>
              )}
                <Button type="submit" disabled={update.isPending} className="shadow-sm">
                  {update.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  disabled={update.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setEditing(true)} className="shadow-sm">
          Update Metadata URI
        </Button>
      )}
    </div>
  );
}
