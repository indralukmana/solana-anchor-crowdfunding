import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export const getProfilePda = (creator: PublicKey, programId: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), creator.toBuffer()],
    programId,
  );

export const getCampaignPda = (
  creator: PublicKey,
  campaignCount: BN,
  programId: PublicKey,
) =>
  PublicKey.findProgramAddressSync(
    [
      Buffer.from("campaign"),
      creator.toBuffer(),
      campaignCount.toArrayLike(Buffer, "le", 8),
    ],
    programId,
  );

export const getVaultPda = (campaignPda: PublicKey, programId: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), campaignPda.toBuffer()],
    programId,
  );

export const getContributionPda = (
  campaignPda: PublicKey,
  donor: PublicKey,
  programId: PublicKey,
) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("contribution"), campaignPda.toBuffer(), donor.toBuffer()],
    programId,
  );
