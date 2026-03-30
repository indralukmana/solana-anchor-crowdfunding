"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContributionPda = exports.getVaultPda = exports.getCampaignPda = exports.getProfilePda = void 0;
const web3_js_1 = require("@solana/web3.js");
const getProfilePda = (creator, programId) => web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("profile"), creator.toBuffer()], programId);
exports.getProfilePda = getProfilePda;
const getCampaignPda = (creator, campaignCount, programId) => web3_js_1.PublicKey.findProgramAddressSync([
    Buffer.from("campaign"),
    creator.toBuffer(),
    campaignCount.toArrayLike(Buffer, "le", 8),
], programId);
exports.getCampaignPda = getCampaignPda;
const getVaultPda = (campaignPda, programId) => web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("vault"), campaignPda.toBuffer()], programId);
exports.getVaultPda = getVaultPda;
const getContributionPda = (campaignPda, donor, programId) => web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("contribution"), campaignPda.toBuffer(), donor.toBuffer()], programId);
exports.getContributionPda = getContributionPda;
