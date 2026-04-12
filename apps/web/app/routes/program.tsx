import { createFileRoute } from "@tanstack/react-router";
import { ProgramDetail } from "@/components/program/program-detail";

export const Route = createFileRoute("/program")({
  component: ProgramPage,
});

function ProgramPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Program Details</h1>
        <p className="mt-2 text-muted-foreground">
          Inspect the on-chain program, its instructions, account types, and events.
        </p>
      </div>
      <ProgramDetail />
    </div>
  );
}
