import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { Crowdfunding } from "../target/types/crowdfunding";
import { Keypair, PublicKey } from "@solana/web3.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

describe("Feature 3: withdraw", () => {
  let creator: Keypair;
  let campaignPda: PublicKey;
  let vaultPda: PublicKey;

  // Creates a campaign with a short deadline and fills the goal
  const setupFilledCampaign = async (deadlineOffsetSeconds = 3) => {
    creator = Keypair.generate();
    await airdrop(provider, creator.publicKey);
    [campaignPda] = getCampaignPda(creator.publicKey, program.programId);
    [vaultPda] = getVaultPda(campaignPda, program.programId);

    const goal = new BN(500_000_000); // 0.5 SOL
    const deadline = new BN(
      Math.floor(Date.now() / 1000) + deadlineOffsetSeconds,
    );

    await program.methods
      .createCampaign(goal, deadline)
      .accountsPartial({ creator: creator.publicKey })
      .signers([creator])
      .rpc();

    const donor = Keypair.generate();
    await airdrop(provider, donor.publicKey);

    await program.methods
      .contribute(new BN(500_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();
  };

  it("✅ creator withdraws after deadline when goal met", async () => {
    await setupFilledCampaign(3);
    await sleep(4000);

    await program.methods
      .withdraw()
      .accountsPartial({
        creator: creator.publicKey,
        campaign: campaignPda,
        vault: vaultPda,
      })
      .signers([creator])
      .rpc();

    // Vault should be empty
    const vaultBalance = await provider.connection.getBalance(vaultPda);
    expect(vaultBalance).toBe(0);

    // Campaign marked as claimed
    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.claimed).toBe(true);
  }, 15_000);

  it("❌ rejects withdraw before deadline", async () => {
    await setupFilledCampaign(86400); // deadline is tomorrow

    await expect(
      program.methods
        .withdraw()
        .accountsPartial({
          creator: creator.publicKey,
          campaign: campaignPda,
          vault: vaultPda,
        })
        .signers([creator])
        .rpc(),
    ).rejects.toThrow(/DeadlineNotReached/);
  });

  it("❌ rejects withdraw when goal not met", async () => {
    creator = Keypair.generate();
    await airdrop(provider, creator.publicKey);
    [campaignPda] = getCampaignPda(creator.publicKey, program.programId);
    [vaultPda] = getVaultPda(campaignPda, program.programId);

    const goal = new BN(1_000_000_000);
    const deadline = new BN(Math.floor(Date.now() / 1000) + 3);

    await program.methods
      .createCampaign(goal, deadline)
      .accountsPartial({ creator: creator.publicKey })
      .signers([creator])
      .rpc();

    const donor = Keypair.generate();
    await airdrop(provider, donor.publicKey);

    // Only contribute half
    await program.methods
      .contribute(new BN(400_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    await sleep(4000);

    await expect(
      program.methods
        .withdraw()
        .accountsPartial({
          creator: creator.publicKey,
          campaign: campaignPda,
          vault: vaultPda,
        })
        .signers([creator])
        .rpc(),
    ).rejects.toThrow(/GoalNotReached/);
  }, 15_000);

  it("❌ rejects withdraw from non-creator", async () => {
    await setupFilledCampaign(3);
    await sleep(4000);

    const nonCreator = Keypair.generate();
    await airdrop(provider, nonCreator.publicKey);

    await expect(
      program.methods
        .withdraw()
        .accountsPartial({
          creator: nonCreator.publicKey,
          campaign: campaignPda,
          vault: vaultPda,
        })
        .signers([nonCreator])
        .rpc(),
    ).rejects.toThrow(/Unauthorized/);
  }, 15_000);

  it("❌ rejects double withdraw", async () => {
    await setupFilledCampaign(3);
    await sleep(4000);

    await program.methods
      .withdraw()
      .accountsPartial({
        creator: creator.publicKey,
        campaign: campaignPda,
        vault: vaultPda,
      })
      .signers([creator])
      .rpc();

    await expect(
      program.methods
        .withdraw()
        .accountsPartial({
          creator: creator.publicKey,
          campaign: campaignPda,
          vault: vaultPda,
        })
        .signers([creator])
        .rpc(),
    ).rejects.toThrow(/AlreadyClaimed/);
  }, 15_000);
});

describe("Feature 4: refund", () => {
  let creator: Keypair;
  let donor: Keypair;
  let campaignPda: PublicKey;
  let vaultPda: PublicKey;

  const setupFailedCampaign = async (deadlineOffsetSeconds = 3) => {
    creator = Keypair.generate();
    donor = Keypair.generate();
    await airdrop(provider, creator.publicKey);
    await airdrop(provider, donor.publicKey);

    [campaignPda] = getCampaignPda(creator.publicKey, program.programId);
    [vaultPda] = getVaultPda(campaignPda, program.programId);

    const goal = new BN(1_000_000_000);
    const deadline = new BN(
      Math.floor(Date.now() / 1000) + deadlineOffsetSeconds,
    );

    await program.methods
      .createCampaign(goal, deadline)
      .accountsPartial({ creator: creator.publicKey })
      .signers([creator])
      .rpc();

    let contributeTx: string;
    try {
      contributeTx = await program.methods
        .contribute(new BN(400_000_000))
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc();
      console.log("contribute tx:", contributeTx);
    } catch (err: any) {
      console.error("contribute FAILED:", err.message);
      console.error("contribute logs:", err.logs ?? "no logs");
      throw err;
    }
  };

  it("✅ donor gets refund after deadline when goal not met", async () => {
    await setupFailedCampaign(4);
    await sleep(4000);

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId,
    );

    // Pre-state
    const donorBalanceBefore = await provider.connection.getBalance(
      donor.publicKey,
    );
    let txSig: string;
    try {
      txSig = await program.methods
        .refund()
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc();
      console.log("tx signature:", txSig);
    } catch (err: any) {
      console.error("--- REFUND FAILED ---");
      console.error("error message:", err.message);
      console.error("error logs:", err.logs ?? "no logs");
      throw err;
    }

    // Post-state
    const donorBalanceAfter = await provider.connection.getBalance(
      donor.publicKey,
    );

    // verify donor got their contribution back
    expect(donorBalanceAfter).toBeGreaterThan(donorBalanceBefore);

    // Contribution account closed
    const contribution = await program.account.contribution
      .fetch(contributionPda)
      .catch(() => null);
    expect(contribution).toBeNull(); // closed by `close = donor`
  }, 15_000);

  it("❌ rejects refund before deadline", async () => {
    await setupFailedCampaign(86400); // deadline tomorrow

    await expect(
      program.methods
        .refund()
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc(),
    ).rejects.toThrow(/DeadlineNotReached/);
  });

  it("❌ rejects refund when goal was met", async () => {
    creator = Keypair.generate();
    donor = Keypair.generate();
    await airdrop(provider, creator.publicKey);
    await airdrop(provider, donor.publicKey);

    [campaignPda] = getCampaignPda(creator.publicKey, program.programId);
    [vaultPda] = getVaultPda(campaignPda, program.programId);

    const goal = new BN(500_000_000);
    const deadline = new BN(Math.floor(Date.now() / 1000) + 3);

    await program.methods
      .createCampaign(goal, deadline)
      .accountsPartial({ creator: creator.publicKey })
      .signers([creator])
      .rpc();

    // Fill the goal
    await program.methods
      .contribute(new BN(500_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    await sleep(4000);

    await expect(
      program.methods
        .refund()
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc(),
    ).rejects.toThrow(/GoalAlreadyReached/);
  }, 15_000);

  it("❌ rejects double refund", async () => {
    await setupFailedCampaign(3);
    await sleep(4000);

    await program.methods
      .refund()
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    await expect(
      program.methods
        .refund()
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc(),
    ).rejects.toThrow(/AccountNotInitialized|AccountDiscriminatorNotFound/);
  }, 15_000);
});
