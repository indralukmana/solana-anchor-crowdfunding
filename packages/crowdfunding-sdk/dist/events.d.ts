import * as anchor from "@coral-xyz/anchor";
import { Provider, Program } from "@coral-xyz/anchor";
export declare const parseEvents: (provider: Provider, program: Program<any>, txSig: string) => Promise<anchor.Event[]>;
export declare const findEvent: (events: anchor.Event[], name: string) => anchor.Event;
