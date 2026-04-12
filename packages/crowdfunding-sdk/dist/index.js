export * from "./pda";
export * from "./events";
export * from "./types/crowdfunding";
export * from "./types/runtime";
import CrowdfundingIdl from "./idl/crowdfunding.json";
import { PublicKey } from "@solana/web3.js";
export { CrowdfundingIdl };
export const PROGRAM_ID = new PublicKey(CrowdfundingIdl.address);
