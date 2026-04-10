import { BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getProfilePda, getCampaignPda, getVaultPda, getContributionPda, parseEvents, findEvent } from "@crowdfunding/sdk";
import { setupTest } from "./utils";

describe("Feature 2: contribute", () => {
  let { program, provider, svm, svmAirdrop, warp, svmGetBalance } = setupTest();
  let creator: Keypair;
  let profilePda: PublicKey;
  let campaignPda: PublicKey;
  let vaultPda: PublicKey;

  beforeEach(async () => {
    ({ program, provider, svm, svmAirdrop, warp, svmGetBalance } = setupTest());
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

  it("contributes below goal, updates raised and contribution PDA", async () => {
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

    const txSig = await program.methods
      .contribute(new BN(400_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        contribution: contributionPda,
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

    const vaultBalance = svmGetBalance(vaultPda);
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

  it("same donor contributes twice, amount accumulates", async () => {
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
      .contribute(new BN(300_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        contribution: contributionPda,
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

    const vaultBalance = svmGetBalance(vaultPda);
    const vaultRent =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(vaultBalance).toBe(600_000_000 + vaultRent);

    const events = await parseEvents(provider, program, txSig);
    const event = findEvent(events, "contributionMade");
    expect(event.data.amount.toNumber()).toBe(300_000_000);
    expect(event.data.totalRaised.toNumber()).toBe(600_000_000);
  });

  it("overfunding allowed — contribution exceeds goal", async () => {
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

    const txSig = await program.methods
      .contribute(new BN(1_500_000_000))
      .accountsPartial({
        campaign: campaignPda,
        vault: vaultPda,
        contribution: contributionPda,
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

    const vaultBalance = svmGetBalance(vaultPda);
    const vaultRent =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(vaultBalance).toBe(1_500_000_000 + vaultRent);

    const events = await parseEvents(provider, program, txSig);
    const event = findEvent(events, "contributionMade");
    expect(event.data.amount.toNumber()).toBe(1_500_000_000);
    expect(event.data.totalRaised.toNumber()).toBe(1_500_000_000);
  });

  it("multiple donors overfund, creator gets full raised amount on withdraw", async () => {
    const donor1 = Keypair.generate();
    const donor2 = Keypair.generate();
    svmAirdrop([donor1.publicKey, donor2.publicKey]);

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
        contribution: contributionPda1,
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
        contribution: contributionPda2,
        donor: donor2.publicKey,
      })
      .signers([donor2])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.raised.toNumber()).toBe(1_600_000_000);

    const vaultBalance = svmGetBalance(vaultPda);
    const vaultRent =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(vaultBalance).toBe(1_600_000_000 + vaultRent);
  });

  it("rejects zero amount contribution", async () => {
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

    await expect(
      program.methods
        .contribute(new BN(0))
        .accountsPartial({
          campaign: campaignPda,
          vault: vaultPda,
          contribution: contributionPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc()
    ).rejects.toThrow(/ZeroAmount/);
  });

  it("rejects contribution after deadline", async () => {
    const shortCreator = Keypair.generate();
    svmAirdrop([shortCreator.publicKey]);

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
    svmAirdrop([donor.publicKey]);

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
          contribution: contributionPda,
          donor: donor.publicKey,
        })
        .signers([donor])
        .rpc()
    ).rejects.toThrow(/DeadlinePassed/);
  });
});
