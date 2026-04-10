import { BN } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { getProfilePda, getCampaignPda, parseEvents, findEvent } from "@crowdfunding/sdk";
import { setupTest } from "./utils";

describe("Feature 1: create_campaign", () => {
  let { program, provider, svm, svmAirdrop } = setupTest();

  beforeEach(() => {
    ({ program, provider, svm, svmAirdrop } = setupTest());
  });

  it("creates a campaign with valid deadline", async () => {
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

  it("rejects a campaign with a past deadline", async () => {
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
