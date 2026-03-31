import { BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getProfilePda, getCampaignPda, getVaultPda, getContributionPda, parseEvents, findEvent } from "@crowdfunding/sdk";
import { setupTest } from "./utils";

describe("Feature 3: withdraw", () => {
  let { program, provider, svm, svmAirdrop, warp, svmGetBalance } = setupTest();
  let creator: Keypair;
  let profilePda: PublicKey;
  let campaignPda: PublicKey;
  let vaultPda: PublicKey;

  beforeEach(() => {
    ({ program, provider, svm, svmAirdrop, warp, svmGetBalance } = setupTest());
  });

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
    svmAirdrop([donor.publicKey]);

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
        contribution: contributionPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();

    return { donor };
  };

  it("creator withdraws after deadline when goal met", async () => {
    await setupFilledCampaign(3);
    warp(20);

    const creatorBalanceBefore = svmGetBalance(creator.publicKey);

    const txSig = await program.methods
      .withdraw()
      .accountsPartial({
        creator: creator.publicKey,
        campaign: campaignPda,
        vault: vaultPda,
      })
      .signers([creator])
      .rpc();

    const creatorBalanceAfter = svmGetBalance(creator.publicKey);
    expect(creatorBalanceAfter).toBeGreaterThan(creatorBalanceBefore);

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.claimed).toBe(true);

    const vaultBalance = svmGetBalance(vaultPda);
    expect(vaultBalance).toBe(0);

    const events = await parseEvents(provider, program, txSig);
    const event = findEvent(events, "fundsWithdrawn");
    expect(event.data.campaign.toBase58()).toBe(campaignPda.toBase58());
    expect(event.data.creator.toBase58()).toBe(creator.publicKey.toBase58());
    const vaultRent =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(event.data.amount.toNumber()).toBe(500_000_000 + vaultRent);
  });

  it("rejects withdraw before deadline", async () => {
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

  it("rejects withdraw when goal not met", async () => {
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
    svmAirdrop([donor.publicKey]);

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
        contribution: contributionPda,
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

  it("rejects withdraw from non-creator", async () => {
    await setupFilledCampaign(3);
    warp(20);

    const nonCreator = Keypair.generate();
    svmAirdrop([nonCreator.publicKey]);

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

  it("rejects double withdraw", async () => {
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
