import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
export declare const getProfilePda: (creator: PublicKey, programId: PublicKey) => [PublicKey, number];
export declare const getCampaignPda: (creator: PublicKey, campaignCount: BN, programId: PublicKey) => [PublicKey, number];
export declare const getVaultPda: (campaignPda: PublicKey, programId: PublicKey) => [PublicKey, number];
export declare const getContributionPda: (campaignPda: PublicKey, donor: PublicKey, programId: PublicKey) => [PublicKey, number];
