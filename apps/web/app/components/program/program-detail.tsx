import { useState } from "react";
import { CrowdfundingIdl, PROGRAM_ID } from "@crowdfunding/sdk";
import { useProgramInfo } from "@/hooks/use-program-info";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatAddress, formatSol } from "@/utils/format";

const EXPLORER_URL = `https://explorer.solana.com/address/${PROGRAM_ID.toBase58()}?cluster=devnet`;

type IdlType = {
  name: string;
  docs?: string[];
  type: {
    kind: string;
    fields?: { name: string; docs?: string[]; type: string }[];
  };
};

type IdlInstruction = {
  name: string;
  docs?: string[];
  accounts: { name: string; writable?: boolean; signer?: boolean }[];
  args: { name: string; type: string }[];
};

const idl = CrowdfundingIdl as {
  address: string;
  metadata: { name: string; version: string; description: string };
  instructions: IdlInstruction[];
  types: IdlType[];
  events: { name: string }[];
  errors: { code: number; name: string; msg: string }[];
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function FieldRow({
  name,
  type,
  docs,
}: {
  name: string;
  type: string;
  docs?: string[];
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-b-0">
      <div className="min-w-0">
        <code className="text-sm font-medium">{name}</code>
        {docs && docs.length > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">{docs[0]}</p>
        )}
      </div>
      <code className="shrink-0 text-xs text-muted-foreground">{type}</code>
    </div>
  );
}

function ExpandableSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{count} items</span>
            <span className="text-sm text-muted-foreground">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </CardHeader>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}

function InstructionCard({ instruction }: { instruction: IdlInstruction }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <code className="text-sm font-medium">{instruction.name}</code>
          {instruction.docs && instruction.docs.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {instruction.docs[0]}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          {instruction.docs && instruction.docs.length > 1 && (
            <div>
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Documentation
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {instruction.docs.join("\n")}
              </p>
            </div>
          )}
          {instruction.accounts.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Accounts
              </h4>
              {instruction.accounts.map((acc) => (
                <div
                  key={acc.name}
                  className="flex items-center gap-2 border-b border-border py-1.5 last:border-b-0"
                >
                  <code className="text-sm">{acc.name}</code>
                  {acc.writable && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      writable
                    </span>
                  )}
                  {acc.signer && (
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                      signer
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {instruction.args.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Arguments
              </h4>
              {instruction.args.map((arg) => (
                <FieldRow key={arg.name} name={arg.name} type={arg.type} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AccountTypeCard({ type }: { type: IdlType }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <code className="text-sm font-medium">{type.name}</code>
      {type.docs && type.docs.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">{type.docs[0]}</p>
      )}
      {type.type.fields && type.type.fields.length > 0 && (
        <div className="mt-2">
          {type.type.fields.map((field) => (
            <FieldRow
              key={field.name}
              name={field.name}
              type={field.type}
              docs={field.docs}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProgramDetail() {
  const { data: accountInfo, isLoading } = useProgramInfo();
  const programId = PROGRAM_ID.toBase58();

  const accountTypes = idl.types.filter((t) =>
    ["Campaign", "Contribution", "CreatorProfile"].includes(t.name),
  );

  const eventTypeNames = idl.events.map((e) => e.name);
  const eventTypes = idl.types.filter((t) => eventTypeNames.includes(t.name));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {idl.metadata.name}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              v{idl.metadata.version}
            </span>
          </CardTitle>
          <CardDescription>{idl.metadata.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Program ID
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="break-all text-sm">{programId}</code>
              <CopyButton text={programId} />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Display
            </p>
            <p className="mt-1 text-sm">{formatAddress(programId)}</p>
          </div>
          <a
            href={EXPLORER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-primary hover:underline"
          >
            View on Explorer
          </a>
        </CardContent>
      </Card>

      {/* On-chain Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">On-Chain Status</CardTitle>
          <CardDescription>
            Live data from the Solana cluster
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-48" />
            </div>
          ) : accountInfo ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Balance
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatSol(accountInfo.lamports)} SOL
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Executable
                </p>
                <p className="mt-1 text-sm">
                  {accountInfo.executable ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Owner
                </p>
                <p className="mt-1 text-sm font-mono">
                  {formatAddress(accountInfo.owner.toBase58())}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Data Size
                </p>
                <p className="mt-1 text-sm">
                  {accountInfo.data.length.toLocaleString()} bytes
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Program account not found on-chain.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <ExpandableSection
        title="Instructions"
        count={idl.instructions.length}
      >
        <div>
          {idl.instructions.map((ix) => (
            <InstructionCard key={ix.name} instruction={ix} />
          ))}
        </div>
      </ExpandableSection>

      {/* Account Types */}
      <ExpandableSection title="Account Types" count={accountTypes.length}>
        <div>
          {accountTypes.map((t) => (
            <AccountTypeCard key={t.name} type={t} />
          ))}
        </div>
      </ExpandableSection>

      {/* Events */}
      <ExpandableSection title="Events" count={eventTypes.length}>
        <div>
          {eventTypes.map((t) => (
            <AccountTypeCard key={t.name} type={t} />
          ))}
        </div>
      </ExpandableSection>
    </div>
  );
}
