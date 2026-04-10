import { createFileRoute } from "@tanstack/react-router";
import { ProfileCard } from "@/components/profile/profile-card";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your creator profile.
        </p>
      </div>
      <ProfileCard />
    </div>
  );
}
