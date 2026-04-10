"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findEvent = exports.parseEvents = void 0;
const anchor_1 = require("@coral-xyz/anchor");
// Parses all Anchor events from a confirmed transaction's log messages.
const parseEvents = async (provider, program, txSig) => {
    const tx = await provider.connection.getTransaction(txSig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
    });
    const logs = tx?.meta?.logMessages ?? [];
    const parser = new anchor_1.EventParser(program.programId, program.coder);
    const events = [];
    for (const event of parser.parseLogs(logs)) {
        events.push(event);
    }
    return events;
};
exports.parseEvents = parseEvents;
// Finds an event by name — throws with a clear message if absent.
// Throwing here narrows the return type to anchor.Event (never null),
// eliminating the TS "possibly null" error on all .data accesses below.
const findEvent = (events, name) => {
    const event = events.find((e) => e?.name === name);
    if (!event) {
        throw new Error(`Expected event "${name}" not found in transaction logs.\nEmitted events: [${events.map((e) => e.name).join(", ") || "none"}]`);
    }
    return event;
};
exports.findEvent = findEvent;
