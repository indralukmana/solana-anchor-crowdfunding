import { BN } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { getProfilePda, getCampaignPda, parseEvents, findEvent } from "@crowdfunding/sdk";
import { setupTest } from "./utils";

describe("Feature 0: profile", () => {
  let { program, provider, svm, svmAirdrop } = setupTest();

  beforeEach(() => {
    ({ program, provider, svm, svmAirdrop } = setupTest());
  });

  it("creates a profile with metadata URI", async () => {
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

  it("updates profile metadata URI", async () => {
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

  it("campaign_count increments after each campaign", async () => {
    const creator = Keypair.generate();
    svmAirdrop([creator.publicKey]);

    const clock = svm.getClock();

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

  it("rejects profile creation with URI over 200 chars", async () => {
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

  it("rejects update from non-creator", async () => {
    const creator = Keypair.generate();
    const nonCreator = Keypair.generate();
    svmAirdrop([creator.publicKey, nonCreator.publicKey]);

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

  it("rejects campaign creation without a profile", async () => {
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
