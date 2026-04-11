import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID } from "./constants";

export function getProfilePda(creator: PublicKey, programId: PublicKey = PROGRAM_ID) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), creator.toBuffer()],
    programId,
  );
}

export function getCampaignPda(
  creator: PublicKey,
  campaignCount: BN,
  programId: PublicKey = PROGRAM_ID,
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("campaign"),
      creator.toBuffer(),
      campaignCount.toArrayLike(Buffer, "le", 8),
    ],
    programId,
  );
}

export function getVaultPda(campaignPda: PublicKey, programId: PublicKey = PROGRAM_ID) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), campaignPda.toBuffer()],
    programId,
  );
}

export function getContributionPda(
  campaignPda: PublicKey,
  donor: PublicKey,
  programId: PublicKey = PROGRAM_ID,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("contribution"), campaignPda.toBuffer(), donor.toBuffer()],
    programId,
  );
}
