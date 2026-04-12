import { createFileRoute } from "@tanstack/react-router";
import { CreateProfileForm } from "@/components/profile/create-profile-form";

export const Route = createFileRoute("/profile/create")({
  component: CreateProfilePage,
});

function CreateProfilePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Profile
        </h1>
        <p className="mt-2 text-muted-foreground">
          Register as a creator to launch campaigns.
        </p>
      </div>
      <CreateProfileForm />
    </div>
  );
}
