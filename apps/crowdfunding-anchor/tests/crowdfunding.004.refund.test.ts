import { BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getProfilePda, getCampaignPda, getVaultPda, getContributionPda, parseEvents, findEvent } from "@crowdfunding/sdk";
import { setupTest } from "./utils";

describe("Feature 4: refund", () => {
  let { program, provider, svm, svmAirdrop, warp, svmGetBalance } = setupTest();
  let creator: Keypair;
  let donor: Keypair;
  let profilePda: PublicKey;
  let campaignPda: PublicKey;
  let vaultPda: PublicKey;

  beforeEach(() => {
    ({ program, provider, svm, svmAirdrop, warp, svmGetBalance } = setupTest());
  });

  const setupFailedCampaign = async (deadlineOffsetSeconds = 3) => {
    creator = Keypair.generate();
    donor = Keypair.generate();
    svmAirdrop([creator.publicKey, donor.publicKey]);

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
        contribution: contributionPda,
        donor: donor.publicKey,
      })
      .signers([donor])
      .rpc();
  };

  it("donor gets refund after deadline when goal not met", async () => {
    await setupFailedCampaign(3);
    warp(20);

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId
    );
    const donorBalanceBefore = svmGetBalance(donor.publicKey);

    const txSig = await program.methods
      .refund()
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
        contribution: contributionPda,
      })
      .signers([donor])
      .rpc();

    const donorBalanceAfter = svmGetBalance(donor.publicKey);
    expect(donorBalanceAfter).toBeGreaterThan(donorBalanceBefore);

    const vaultBalance = svmGetBalance(vaultPda);
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

  it("rejects refund before deadline", async () => {
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

  it("rejects refund when goal was met", async () => {
    creator = Keypair.generate();
    donor = Keypair.generate();
    svmAirdrop([creator.publicKey, donor.publicKey]);

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
        contribution: contributionPda,
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

  it("rejects refund from non-donor", async () => {
    await setupFailedCampaign(3);
    warp(20);

    const nonDonor = Keypair.generate();
    svmAirdrop([nonDonor.publicKey]);

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
    ).rejects.toThrow();
  });

  it("rejects double refund", async () => {
    await setupFailedCampaign(3);
    warp(20);

    const [contributionPda] = getContributionPda(
      campaignPda,
      donor.publicKey,
      program.programId
    );

    await program.methods
      .refund()
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        donor: donor.publicKey,
        contribution: contributionPda,
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
          contribution: contributionPda,
        })
        .signers([donor])
        .rpc()
    ).rejects.toThrow();
  });
});
