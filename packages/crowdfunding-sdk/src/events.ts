import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, EventParser, Program } from "@coral-xyz/anchor";

// Parses all Anchor events from a confirmed transaction's log messages.
export const parseEvents = async (
  provider: AnchorProvider,
  program: Program<any>,
  txSig: string,
): Promise<anchor.Event[]> => {
  const tx = await provider.connection.getTransaction(txSig, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  const logs = tx?.meta?.logMessages ?? [];
  const parser = new EventParser(program.programId, program.coder);
  const events: anchor.Event[] = [];
  for (const event of parser.parseLogs(logs)) {
    events.push(event);
  }
  return events;
};

// Finds an event by name — throws with a clear message if absent.
// Throwing here narrows the return type to anchor.Event (never null),
// eliminating the TS "possibly null" error on all .data accesses below.
export const findEvent = (events: anchor.Event[], name: string): anchor.Event => {
  const event = events.find((e) => e?.name === name);
  if (!event) {
    throw new Error(
      `Expected event "${name}" not found in transaction logs.\nEmitted events: [${
        events.map((e) => e.name).join(", ") || "none"
      }]`,
    );
  }
  return event;
};
