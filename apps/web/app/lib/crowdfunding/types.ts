import type { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";

export interface Campaign {
  creator: PublicKey;
  campaignId: BN;
  goal: BN;
  raised: BN;
  deadline: BN;
  claimed: boolean;
  bump: number;
}

export interface CreatorProfile {
  creator: PublicKey;
  campaignCount: BN;
  metadataUri: string;
  bump: number;
}

export interface Contribution {
  donor: PublicKey;
  amount: BN;
  campaign: PublicKey;
}
