import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Crowdfunding } from "@crowdfunding/sdk";
import { Keypair, PublicKey } from "@solana/web3.js";
import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";

import {
  getProfilePda,
  getCampaignPda,
  getVaultPda,
  getContributionPda,
  parseEvents,
  findEvent,
} from "@crowdfunding/sdk";

// ── Shared setup ──────────────────────────────────────────────────────────────
const svm = fromWorkspace("./").withDefaultPrograms().withBuiltins().withSysvars();
const provider = new LiteSVMProvider(svm);

// Monkey-patch missing methods on LiteSVMConnectionProxy
(provider.connection as any).getBalance = async (publicKey: PublicKey) => {
  return Number(svm.getBalance(publicKey) ?? BigInt(0));
};
(provider.connection as any).getTransaction = async (txSig: string) => {
  const meta = svm.getTransaction(anchor.utils.bytes.bs58.decode(txSig));
  if (!meta) return null;
  // TransactionMetadata in litesvm has logs() method
  const logs = "logs" in meta ? (meta as any).logs() : (meta as any).meta().logs();
  return {
    meta: {
      logMessages: logs,
      err: "err" in meta ? (meta as any).err() : null,
    },
  };
};

anchor.setProvider(provider);

const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;

const svmAirdrop = async (addresses: PublicKey[]) => {
  for (const address of addresses) {
    svm.airdrop(address, BigInt(10 * 1_000_000_000));
  }
};

const warp = (seconds: number) => {
  const clock = svm.getClock();
  clock.slot += BigInt(Math.ceil(seconds / 0.4));
  clock.unixTimestamp += BigInt(seconds);
  svm.setClock(clock);
};

// ── Feature 0: profile ────────────────────────────────────────────────────────

describe("Feature 0: profile", () => {
  it("✅ creates a profile with metadata URI", async () => {
    const creator = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    const [profilePda] = getProfilePda(creator.publicKey, program.programId);

    const txSig = await program.methods
      .createProfile("ipfs://QmExampleHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    const profile = await program.account.creatorProfile.fetch(profilePda);
    expect(profile.creator.toBase58()).toBe(creator.publicKey.toBase58());
    expect(profile.metadataUri).toBe("ipfs://QmExampleHash");
    expect(profile.campaignCount.toNumber()).toBe(0);

    const events = await parseEvents(provider, program, txSig);
    const event = findEvent(events, "profileCreated");
    expect(event.data.creator.toBase58()).toBe(creator.publicKey.toBase58());
    expect(event.data.metadataUri).toBe("ipfs://QmExampleHash");
  });

  it("✅ updates profile metadata URI", async () => {
    const creator = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    const [profilePda] = getProfilePda(creator.publicKey, program.programId);

    await program.methods
      .createProfile("ipfs://QmOldHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    const txSig = await program.methods
      .updateProfile("ipfs://QmNewHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    const profile = await program.account.creatorProfile.fetch(profilePda);
    expect(profile.metadataUri).toBe("ipfs://QmNewHash");

    const events = await parseEvents(provider, program, txSig);
    const event = findEvent(events, "profileUpdated");
    expect(event.data.creator.toBase58()).toBe(creator.publicKey.toBase58());
    expect(event.data.metadataUri).toBe("ipfs://QmNewHash");
  });

  it("✅ campaign_count increments after each campaign", async () => {
    const creator = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    const clock = svm.getClock()

    const [profilePda] = getProfilePda(creator.publicKey, program.programId);

    await program.methods
      .createProfile("ipfs://QmExampleHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    const [campaignPda1] = getCampaignPda(
      creator.publicKey,
      new BN(0),
      program.programId
    );
    await program.methods
      .createCampaign(
        new BN(1_000_000_000),
        new BN(clock.unixTimestamp.toString()).add(new BN(86400))
      )
      .accountsPartial({
        creator: creator.publicKey,
        profile: profilePda,
        campaign: campaignPda1,
      })
      .signers([creator])
      .rpc();

    const profileAfterFirst = await program.account.creatorProfile.fetch(
      profilePda
    );
    expect(profileAfterFirst.campaignCount.toNumber()).toBe(1);

    const [campaignPda2] = getCampaignPda(
      creator.publicKey,
      new BN(1),
      program.programId
    );
    await program.methods
      .createCampaign(
        new BN(500_000_000),
        new BN(clock.unixTimestamp.toString()).add(new BN(86400))
    )
      .accountsPartial({
        creator: creator.publicKey,
        profile: profilePda,
        campaign: campaignPda2,
      })
      .signers([creator])
      .rpc();

    const profileAfterSecond = await program.account.creatorProfile.fetch(
      profilePda
    );
    expect(profileAfterSecond.campaignCount.toNumber()).toBe(2);

    const c1 = await program.account.campaign.fetch(campaignPda1);
    const c2 = await program.account.campaign.fetch(campaignPda2);
    expect(c1.campaignId.toNumber()).toBe(0);
    expect(c2.campaignId.toNumber()).toBe(1);
  });

  it("❌ rejects profile creation with URI over 200 chars", async () => {
    const creator = Keypair.generate();
    svmAirdrop([creator.publicKey]);


    const [profilePda] = getProfilePda(creator.publicKey, program.programId);
    const longUri = "ipfs://" + "a".repeat(200);

    await expect(
      program.methods
        .createProfile(longUri)
        .accountsPartial({ creator: creator.publicKey, profile: profilePda })
        .signers([creator])
        .rpc()
    ).rejects.toThrow(/UriTooLong/);
  });

  it("❌ rejects update from non-creator", async () => {
    const creator = Keypair.generate();
    const nonCreator = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    svm.airdrop(nonCreator.publicKey, BigInt(2_000_000_000));

    const [profilePda] = getProfilePda(creator.publicKey, program.programId);

    await program.methods
      .createProfile("ipfs://QmExampleHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    await expect(
      program.methods
        .updateProfile("ipfs://QmHackedHash")
        .accountsPartial({ creator: nonCreator.publicKey, profile: profilePda })
        .signers([nonCreator])
        .rpc()
    ).rejects.toThrow(/ConstraintHasOne|HasOneViolated|ConstraintSeeds/);
  });

  it("❌ rejects campaign creation without a profile", async () => {
    const creator = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    const clock = svm.getClock();

    const [profilePda] = getProfilePda(creator.publicKey, program.programId);
    const [campaignPda] = getCampaignPda(
      creator.publicKey,
      new BN(0),
      program.programId
    );

    await expect(
      program.methods
        .createCampaign(
          new BN(1_000_000_000),
          new BN(clock.unixTimestamp.toString()).add(new BN(86400))
        )
        .accountsPartial({
          creator: creator.publicKey,
          profile: profilePda,
          campaign: campaignPda,
        })
        .signers([creator])
        .rpc()
    ).rejects.toThrow(/AccountNotInitialized|AccountDiscriminatorNotFound/);
  });
});

// ── Feature 1: create_campaign ────────────────────────────────────────────────

describe("Feature 1: create_campaign", () => {
  it("✅ creates a campaign with valid deadline", async () => {
    const creator = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    const clock = svm.getClock();

    const [profilePda] = getProfilePda(creator.publicKey, program.programId);
    const [campaignPda] = getCampaignPda(
      creator.publicKey,
      new BN(0),
      program.programId
    );

    await program.methods
      .createProfile("ipfs://QmExampleHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    const goal = new BN(1_000_000_000);
    const deadline = new BN(clock.unixTimestamp.toString()).add(new BN(86400));

    const txSig = await program.methods
      .createCampaign(goal, deadline)
      .accountsPartial({
        creator: creator.publicKey,
        profile: profilePda,
        campaign: campaignPda,
      })
      .signers([creator])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.creator.toBase58()).toBe(creator.publicKey.toBase58());
    expect(campaign.campaignId.toNumber()).toBe(0);
    expect(campaign.goal.toNumber()).toBe(goal.toNumber());
    expect(campaign.raised.toNumber()).toBe(0);
    expect(campaign.claimed).toBe(false);

    const events = await parseEvents(provider, program, txSig);
    const event = findEvent(events, "campaignCreated");
    expect(event.data.creator.toBase58()).toBe(creator.publicKey.toBase58());
    expect(event.data.campaign.toBase58()).toBe(campaignPda.toBase58());
    expect(event.data.campaignId.toNumber()).toBe(0);
    expect(event.data.goal.toNumber()).toBe(goal.toNumber());
    expect(event.data.deadline.toNumber()).toBe(deadline.toNumber());
  });

  it("❌ rejects a campaign with a past deadline", async () => {
    const creator = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    const clock = svm.getClock();

    const [profilePda] = getProfilePda(creator.publicKey, program.programId);
    const [campaignPda] = getCampaignPda(
      creator.publicKey,
      new BN(0),
      program.programId
    );

    await program.methods
      .createProfile("ipfs://QmExampleHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    await expect(
      program.methods
        .createCampaign(
          new BN(1_000_000_000),
          new BN(clock.unixTimestamp.toString()).sub(new BN(86400))
        )
        .accountsPartial({
          creator: creator.publicKey,
          profile: profilePda,
          campaign: campaignPda,
        })
        .signers([creator])
        .rpc()
    ).rejects.toThrow(/InvalidDeadline/);
  });
});

// ── Feature 2: contribute ─────────────────────────────────────────────────────

describe("Feature 2: contribute", () => {
  let creator: Keypair;
  let profilePda: PublicKey;
  let campaignPda: PublicKey;
  let vaultPda: PublicKey;

  beforeEach(async () => {
    creator = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    const clock = svm.getClock();

    [profilePda] = getProfilePda(creator.publicKey, program.programId);
    [campaignPda] = getCampaignPda(
      creator.publicKey,
      new BN(0),
      program.programId
    );
    [vaultPda] = getVaultPda(campaignPda, program.programId);

    await program.methods
      .createProfile("ipfs://QmExampleHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    await program.methods
      .createCampaign(
        new BN(1_000_000_000),
        new BN(clock.unixTimestamp.toString()).add(new BN(86400))
      )
      .accountsPartial({
        creator: creator.publicKey,
        profile: profilePda,
        campaign: campaignPda,
      })
      .signers([creator])
      .rpc();
  });

  it("✅ contributes below goal, updates raised and contribution PDA", async () => {
    const donor = Keypair.generate();
    svm.airdrop(donor.publicKey, BigInt(2_000_000_000));

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId
    );

    await program.methods
      .initializeContribution()
      .accountsPartial({
        campaign: campaignPda,
        contribution: contributionPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    const txSig = await program.methods
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
      contributionPda
    );
    expect(contribution.amount.toNumber()).toBe(400_000_000);

    const vaultBalance = await provider.connection.getBalance(vaultPda);
    const vaultRent =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(vaultBalance).toBe(400_000_000 + vaultRent);

    const events = await parseEvents(provider, program, txSig);
    const event = findEvent(events, "contributionMade");
    expect(event.data.campaign.toBase58()).toBe(campaignPda.toBase58());
    expect(event.data.donor.toBase58()).toBe(donor.publicKey.toBase58());
    expect(event.data.amount.toNumber()).toBe(400_000_000);
    expect(event.data.totalRaised.toNumber()).toBe(400_000_000);
  });

  it("✅ same donor contributes twice, amount accumulates", async () => {
    const donor = Keypair.generate();
    svm.airdrop(donor.publicKey, BigInt(2_000_000_000));

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId
    );

    await program.methods
      .initializeContribution()
      .accountsPartial({
        campaign: campaignPda,
        contribution: contributionPda,
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

    svm.expireBlockhash();

    const txSig = await program.methods
      .contribute(new BN(300_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        contribution: contributionPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    const contribution = await program.account.contribution.fetch(
      contributionPda
    );
    expect(contribution.amount.toNumber()).toBe(600_000_000);

    const vaultBalance = await provider.connection.getBalance(vaultPda);
    const vaultRent =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(vaultBalance).toBe(600_000_000 + vaultRent);

    const events = await parseEvents(provider, program, txSig);
    const event = findEvent(events, "contributionMade");
    expect(event.data.amount.toNumber()).toBe(300_000_000);
    expect(event.data.totalRaised.toNumber()).toBe(600_000_000);
  });

  it("✅ overfunding allowed — contribution exceeds goal", async () => {
    const donor = Keypair.generate();
    svm.airdrop(donor.publicKey, BigInt(2_000_000_000));

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId
    );

    await program.methods
      .initializeContribution()
      .accountsPartial({
        campaign: campaignPda,
        contribution: contributionPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    const txSig = await program.methods
      .contribute(new BN(1_500_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.raised.toNumber()).toBe(1_500_000_000);

    const contribution = await program.account.contribution.fetch(
      contributionPda
    );
    expect(contribution.amount.toNumber()).toBe(1_500_000_000);

    const vaultBalance = await provider.connection.getBalance(vaultPda);
    const vaultRent =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(vaultBalance).toBe(1_500_000_000 + vaultRent);

    const events = await parseEvents(provider, program, txSig);
    const event = findEvent(events, "contributionMade");
    expect(event.data.amount.toNumber()).toBe(1_500_000_000);
    expect(event.data.totalRaised.toNumber()).toBe(1_500_000_000);
  });

  it("✅ multiple donors overfund, creator gets full raised amount on withdraw", async () => {
    const donor1 = Keypair.generate();
    const donor2 = Keypair.generate();
    svm.airdrop(donor1.publicKey, BigInt(2_000_000_000));
    svm.airdrop(donor2.publicKey, BigInt(2_000_000_000));

    const [contributionPda1] = getContributionPda(
      campaignPda,
      donor1.publicKey,
      program.programId
    );
    await program.methods
      .initializeContribution()
      .accountsPartial({
        campaign: campaignPda,
        contribution: contributionPda1,
        donor: donor1.publicKey,
      })
      .signers([donor1])
      .rpc();

    await program.methods
      .contribute(new BN(800_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor1.publicKey,
      })
      .signers([donor1])
      .rpc();

    const [contributionPda2] = getContributionPda(
      campaignPda,
      donor2.publicKey,
      program.programId
    );
    await program.methods
      .initializeContribution()
      .accountsPartial({
        campaign: campaignPda,
        contribution: contributionPda2,
        donor: donor2.publicKey,
      })
      .signers([donor2])
      .rpc();

    await program.methods
      .contribute(new BN(800_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor2.publicKey,
      })
      .signers([donor2])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.raised.toNumber()).toBe(1_600_000_000);

    const vaultBalance = await provider.connection.getBalance(vaultPda);
    const vaultRent =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(vaultBalance).toBe(1_600_000_000 + vaultRent);
  });

  it("❌ rejects zero amount contribution", async () => {
    const donor = Keypair.generate();
    svm.airdrop(donor.publicKey, BigInt(2_000_000_000));

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId
    );
    await program.methods
      .initializeContribution()
      .accountsPartial({
        campaign: campaignPda,
        contribution: contributionPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    await expect(
      program.methods
        .contribute(new BN(0))
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc()
    ).rejects.toThrow(/ZeroAmount/);
  });

  it("❌ rejects contribution after deadline", async () => {
    const shortCreator = Keypair.generate();
    svm.airdrop(shortCreator.publicKey, BigInt(2_000_000_000));

    const [shortProfilePda] = getProfilePda(
      shortCreator.publicKey,
      program.programId
    );
    const [shortCampaignPda] = getCampaignPda(
      shortCreator.publicKey,
      new BN(0),
      program.programId
    );
    const [shortVaultPda] = getVaultPda(shortCampaignPda, program.programId);

    await program.methods
      .createProfile("ipfs://QmExampleHash")
      .accountsPartial({
        creator: shortCreator.publicKey,
        profile: shortProfilePda,
      })
      .signers([shortCreator])
      .rpc();

    const clockBefore = svm.getClock();
    await program.methods
      .createCampaign(
        new BN(1_000_000_000),
        new BN(clockBefore.unixTimestamp.toString()).add(new BN(3))
      )
      .accountsPartial({
        creator: shortCreator.publicKey,
        profile: shortProfilePda,
        campaign: shortCampaignPda,
      })
      .signers([shortCreator])
      .rpc();

    warp(20);

    const donor = Keypair.generate();
    svm.airdrop(donor.publicKey, BigInt(2_000_000_000));

    const [contributionPda] = getContributionPda(
      shortCampaignPda,
      donor.publicKey,
      program.programId
    );
    await program.methods
      .initializeContribution()
      .accountsPartial({
        campaign: shortCampaignPda,
        contribution: contributionPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    await expect(
      program.methods
        .contribute(new BN(100_000_000))
        .accountsPartial({
          campaign: shortCampaignPda,
          vault: shortVaultPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc()
    ).rejects.toThrow(/DeadlinePassed/);
  });
});

// ── Feature 3: withdraw ───────────────────────────────────────────────────────

describe("Feature 3: withdraw", () => {
  let creator: Keypair;
  let profilePda: PublicKey;
  let campaignPda: PublicKey;
  let vaultPda: PublicKey;

  const setupFilledCampaign = async (deadlineOffsetSeconds = 3) => {
    creator = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    const clock = svm.getClock();

    [profilePda] = getProfilePda(creator.publicKey, program.programId);
    [campaignPda] = getCampaignPda(
      creator.publicKey,
      new BN(0),
      program.programId
    );
    [vaultPda] = getVaultPda(campaignPda, program.programId);

    await program.methods
      .createProfile("ipfs://QmExampleHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    await program.methods
      .createCampaign(
        new BN(500_000_000),
        new BN(clock.unixTimestamp.toString()).add(
          new BN(deadlineOffsetSeconds)
        )
      )
      .accountsPartial({
        creator: creator.publicKey,
        profile: profilePda,
        campaign: campaignPda,
      })
      .signers([creator])
      .rpc();

    const donor = Keypair.generate();
    svm.airdrop(donor.publicKey, BigInt(2000000000));

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId
    );
    await program.methods
      .initializeContribution()
      .accountsPartial({
        campaign: campaignPda,
        contribution: contributionPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    await program.methods
      .contribute(new BN(500_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    return { donor };
  };

  it("✅ creator withdraws after deadline when goal met", async () => {
    await setupFilledCampaign(3);
    warp(20);

    const creatorBalanceBefore = await provider.connection.getBalance(
      creator.publicKey
    );

    const txSig = await program.methods
      .withdraw()
      .accountsPartial({
        creator: creator.publicKey,
        campaign: campaignPda,
        vault: vaultPda,
      })
      .signers([creator])
      .rpc();

    const creatorBalanceAfter = await provider.connection.getBalance(
      creator.publicKey
    );
    expect(creatorBalanceAfter).toBeGreaterThan(creatorBalanceBefore);

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.claimed).toBe(true);

    const vaultBalance = await provider.connection.getBalance(vaultPda);
    expect(vaultBalance).toBe(0);

    const events = await parseEvents(provider, program, txSig);
    const event = findEvent(events, "fundsWithdrawn");
    expect(event.data.campaign.toBase58()).toBe(campaignPda.toBase58());
    expect(event.data.creator.toBase58()).toBe(creator.publicKey.toBase58());
    const vaultRent =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(event.data.amount.toNumber()).toBe(500_000_000 + vaultRent);
  });

  it("❌ rejects withdraw before deadline", async () => {
    await setupFilledCampaign(86400);

    await expect(
      program.methods
        .withdraw()
        .accountsPartial({
          creator: creator.publicKey,
          campaign: campaignPda,
          vault: vaultPda,
        })
        .signers([creator])
        .rpc()
    ).rejects.toThrow(/DeadlineNotReached/);
  });

  it("❌ rejects withdraw when goal not met", async () => {
    creator = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    const clock = svm.getClock();

    [profilePda] = getProfilePda(creator.publicKey, program.programId);
    [campaignPda] = getCampaignPda(
      creator.publicKey,
      new BN(0),
      program.programId
    );
    [vaultPda] = getVaultPda(campaignPda, program.programId);

    await program.methods
      .createProfile("ipfs://QmExampleHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    await program.methods
      .createCampaign(
        new BN(1_000_000_000),
        new BN(clock.unixTimestamp.toString()).add(new BN(3))
      )
      .accountsPartial({
        creator: creator.publicKey,
        profile: profilePda,
        campaign: campaignPda,
      })
      .signers([creator])
      .rpc();

    const donor = Keypair.generate();
    svm.airdrop(donor.publicKey, BigInt(2000000000));

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId
    );
    await program.methods
      .initializeContribution()
      .accountsPartial({
        campaign: campaignPda,
        contribution: contributionPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    await program.methods
      .contribute(new BN(400_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    warp(20);

    await expect(
      program.methods
        .withdraw()
        .accountsPartial({
          creator: creator.publicKey,
          campaign: campaignPda,
          vault: vaultPda,
        })
        .signers([creator])
        .rpc()
    ).rejects.toThrow(/GoalNotReached/);
  });

  it("❌ rejects withdraw from non-creator", async () => {
    await setupFilledCampaign(3);
    warp(20);

    const nonCreator = Keypair.generate();
    svm.airdrop(nonCreator.publicKey, BigInt(2000000000));

    await expect(
      program.methods
        .withdraw()
        .accountsPartial({
          creator: nonCreator.publicKey,
          campaign: campaignPda,
          vault: vaultPda,
        })
        .signers([nonCreator])
        .rpc()
    ).rejects.toThrow(/Unauthorized/);
  });

  it("❌ rejects double withdraw", async () => {
    await setupFilledCampaign(3);
    warp(20);

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
        .rpc()
    ).rejects.toThrow();
  });
});

// ── Feature 4: refund ─────────────────────────────────────────────────────────

describe("Feature 4: refund", () => {
  let creator: Keypair;
  let donor: Keypair;
  let profilePda: PublicKey;
  let campaignPda: PublicKey;
  let vaultPda: PublicKey;

  const setupFailedCampaign = async (deadlineOffsetSeconds = 3) => {
    creator = Keypair.generate();
    donor = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    svm.airdrop(donor.publicKey, BigInt(2000000000));

    const clock = svm.getClock();

    [profilePda] = getProfilePda(creator.publicKey, program.programId);
    [campaignPda] = getCampaignPda(
      creator.publicKey,
      new BN(0),
      program.programId
    );
    [vaultPda] = getVaultPda(campaignPda, program.programId);

    await program.methods
      .createProfile("ipfs://QmExampleHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    await program.methods
      .createCampaign(
        new BN(1_000_000_000),
        new BN(clock.unixTimestamp.toString()).add(
          new BN(deadlineOffsetSeconds)
        )
      )
      .accountsPartial({
        creator: creator.publicKey,
        profile: profilePda,
        campaign: campaignPda,
      })
      .signers([creator])
      .rpc();

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId
    );
    await program.methods
      .initializeContribution()
      .accountsPartial({
        campaign: campaignPda,
        contribution: contributionPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    await program.methods
      .contribute(new BN(400_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();
  };

  it("✅ donor gets refund after deadline when goal not met", async () => {
    await setupFailedCampaign(3);
    warp(20);

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId
    );
    const donorBalanceBefore = await provider.connection.getBalance(
      donor.publicKey
    );

    const txSig = await program.methods
      .refund()
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    const donorBalanceAfter = await provider.connection.getBalance(
      donor.publicKey
    );
    expect(donorBalanceAfter).toBeGreaterThan(donorBalanceBefore);

    const vaultBalance = await provider.connection.getBalance(vaultPda);
    const vaultRent =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(vaultBalance).toBe(vaultRent);

    const contribution = await program.account.contribution
      .fetch(contributionPda)
      .catch(() => null);
    expect(contribution).toBeNull();

    const events = await parseEvents(provider, program, txSig);
    const event = findEvent(events, "refundIssued");
    expect(event.data.campaign.toBase58()).toBe(campaignPda.toBase58());
    expect(event.data.donor.toBase58()).toBe(donor.publicKey.toBase58());
    expect(event.data.amount.toNumber()).toBe(400_000_000);
  });

  it("❌ rejects refund before deadline", async () => {
    await setupFailedCampaign(86400);

    await expect(
      program.methods
        .refund()
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc()
    ).rejects.toThrow(/DeadlineNotReached/);
  });

  it("❌ rejects refund when goal was met", async () => {
    creator = Keypair.generate();
    donor = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    svm.airdrop(donor.publicKey, BigInt(2000000000));

    const clock = svm.getClock();

    [profilePda] = getProfilePda(creator.publicKey, program.programId);
    [campaignPda] = getCampaignPda(
      creator.publicKey,
      new BN(0),
      program.programId
    );
    [vaultPda] = getVaultPda(campaignPda, program.programId);

    await program.methods
      .createProfile("ipfs://QmExampleHash")
      .accountsPartial({ creator: creator.publicKey, profile: profilePda })
      .signers([creator])
      .rpc();

    await program.methods
      .createCampaign(
        new BN(500_000_000),
        new BN(clock.unixTimestamp.toString()).add(new BN(3))
      )
      .accountsPartial({
        creator: creator.publicKey,
        profile: profilePda,
        campaign: campaignPda,
      })
      .signers([creator])
      .rpc();

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId
    );
    await program.methods
      .initializeContribution()
      .accountsPartial({
        campaign: campaignPda,
        contribution: contributionPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    await program.methods
      .contribute(new BN(600_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    warp(20);

    await expect(
      program.methods
        .refund()
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc()
    ).rejects.toThrow(/GoalAlreadyReached/);
  });

  it("❌ rejects refund from non-donor", async () => {
    await setupFailedCampaign(3);
    warp(20);

    const nonDonor = Keypair.generate();
    svm.airdrop(nonDonor.publicKey, BigInt(2000000000));

    await expect(
      program.methods
        .refund()
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          donor: nonDonor.publicKey,
        })
        .signers([nonDonor])
        .rpc()
    ).rejects.toThrow(/AccountNotInitialized|AccountDiscriminatorNotFound/);
  });

  it("❌ rejects double refund", async () => {
    await setupFailedCampaign(3);
    warp(20);

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
        .rpc()
    ).rejects.toThrow();
  });
});
