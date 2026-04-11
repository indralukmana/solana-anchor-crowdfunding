import { PublicKey } from "@solana/web3.js";
export const getProfilePda = (creator, programId) => PublicKey.findProgramAddressSync([Buffer.from("profile"), creator.toBuffer()], programId);
export const getCampaignPda = (creator, campaignCount, programId) => PublicKey.findProgramAddressSync([
    Buffer.from("campaign"),
    creator.toBuffer(),
    campaignCount.toArrayLike(Buffer, "le", 8),
], programId);
export const getVaultPda = (campaignPda, programId) => PublicKey.findProgramAddressSync([Buffer.from("vault"), campaignPda.toBuffer()], programId);
export const getContributionPda = (campaignPda, donor, programId) => PublicKey.findProgramAddressSync([Buffer.from("contribution"), campaignPda.toBuffer(), donor.toBuffer()], programId);
