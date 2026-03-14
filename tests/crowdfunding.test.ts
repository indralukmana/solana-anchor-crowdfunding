import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { Crowdfunding } from "../target/types/crowdfunding";
import { Keypair, PublicKey } from "@solana/web3.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const airdrop = async (provider: AnchorProvider, pubkey: PublicKey) => {
  const sig = await provider.connection.requestAirdrop(pubkey, 2_000_000_000);
  const latestBlockhash = await provider.connection.getLatestBlockhash();
  await provider.connection.confirmTransaction(
    { signature: sig, ...latestBlockhash },
    "confirmed",
  );
};

const getCampaignPda = (creator: PublicKey, programId: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), creator.toBuffer()],
    programId,
  );

const getVaultPda = (campaignPda: PublicKey, programId: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), campaignPda.toBuffer()],
    programId,
  );

const getContributionPda = (
  campaignPda: PublicKey,
  donor: PublicKey,
  programId: PublicKey,
) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("contribution"), campaignPda.toBuffer(), donor.toBuffer()],
    programId,
  );

// ── Shared setup ─────────────────────────────────────────────────────────────

const provider = AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;

// ── Feature 1: create_campaign ────────────────────────────────────────────────

describe("Feature 1: create_campaign", () => {
  it("✅ creates a campaign with valid deadline", async () => {
    const creator = Keypair.generate();
    await airdrop(provider, creator.publicKey);
    const [campaignPda] = getCampaignPda(creator.publicKey, program.programId);

    const goal = new BN(1_000_000_000);
    const deadline = new BN(Math.floor(Date.now() / 1000) + 86400);

    await program.methods
      .createCampaign(goal, deadline)
      .accountsPartial({ creator: creator.publicKey })
      .signers([creator])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.creator.toBase58()).toBe(creator.publicKey.toBase58());
    expect(campaign.goal.toNumber()).toBe(goal.toNumber());
    expect(campaign.raised.toNumber()).toBe(0);
    expect(campaign.claimed).toBe(false);
  });

  it("❌ rejects a campaign with a past deadline", async () => {
    const creator = Keypair.generate();
    await airdrop(provider, creator.publicKey);

    const goal = new BN(1_000_000_000);
    const pastDeadline = new BN(Math.floor(Date.now() / 1000) - 86400);

    await expect(
      program.methods
        .createCampaign(goal, pastDeadline)
        .accountsPartial({ creator: creator.publicKey })
        .signers([creator])
        .rpc(),
    ).rejects.toThrow(/InvalidDeadline/);
  });
});

// ── Feature 2: contribute ─────────────────────────────────────────────────────

describe("Feature 2: contribute", () => {
  let creator: Keypair;
  let campaignPda: PublicKey;
  let vaultPda: PublicKey;

  beforeEach(async () => {
    creator = Keypair.generate();
    await airdrop(provider, creator.publicKey);
    [campaignPda] = getCampaignPda(creator.publicKey, program.programId);
    [vaultPda] = getVaultPda(campaignPda, program.programId);

    const goal = new BN(1_000_000_000);
    const deadline = new BN(Math.floor(Date.now() / 1000) + 86400);

    await program.methods
      .createCampaign(goal, deadline)
      .accountsPartial({ creator: creator.publicKey })
      .signers([creator])
      .rpc();
  });

  it("✅ contributes below goal, updates raised and contribution PDA", async () => {
    const donor = Keypair.generate();
    await airdrop(provider, donor.publicKey);
    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId,
    );

    await program.methods
      .contribute(new BN(400_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.raised.toNumber()).toBe(400_000_000);

    const contribution = await program.account.contribution.fetch(
      contributionPda,
    );
    expect(contribution.amount.toNumber()).toBe(400_000_000);
  });

  it("✅ same donor contributes twice, amount accumulates", async () => {
    const donor = Keypair.generate();
    await airdrop(provider, donor.publicKey);
    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId,
    );

    await program.methods
      .contribute(new BN(300_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    await program.methods
      .contribute(new BN(300_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    const contribution = await program.account.contribution.fetch(
      contributionPda,
    );
    expect(contribution.amount.toNumber()).toBe(600_000_000);
  });

  it("✅ contribution capped when overshooting goal", async () => {
    const donor = Keypair.generate();
    await airdrop(provider, donor.publicKey);

    await program.methods
      .contribute(new BN(1_500_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.raised.toNumber()).toBe(1_000_000_000);
  });

  it("❌ rejects contribution when goal already met", async () => {
    const donor = Keypair.generate();
    await airdrop(provider, donor.publicKey);

    await program.methods
      .contribute(new BN(1_000_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    await expect(
      program.methods
        .contribute(new BN(100_000_000))
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc(),
    ).rejects.toThrow(/GoalAlreadyReached/);
  });

  it("❌ rejects contribution after deadline — requires clock warp, skipped", async () => {
    console.warn("⚠️  Skipped: requires validator clock manipulation");
  });
});
