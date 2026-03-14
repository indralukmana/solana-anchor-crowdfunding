import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Crowdfunding } from "../target/types/crowdfunding";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";

// const getProvider = () => {
//   const connection = new Connection("http://localhost:8899", "confirmed");
//   const wallet = anchor.AnchorProvider.env().wallet;
//   return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
// };

const getProvider = () => AnchorProvider.env();

const getCampaignPda = (creator: PublicKey, programId: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), creator.toBuffer()],
    programId,
  );

const airdrop = async (provider: AnchorProvider, pubkey: PublicKey) => {
  const sig = await provider.connection.requestAirdrop(pubkey, 2_000_000_000);
  const latestBlockhash = await provider.connection.getLatestBlockhash();
  await provider.connection.confirmTransaction(
    { signature: sig, ...latestBlockhash },
    "confirmed",
  );
};

describe("Feature 1: create_campaign", () => {
  const provider = getProvider();
  anchor.setProvider(provider);
  const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;

  it("✅ creates a campaign with valid deadline", async () => {
    const creator = provider.wallet.publicKey;
    const [campaignPda] = getCampaignPda(creator, program.programId);
    const goal = new BN(1_000_000_000);
    const deadline = new BN(Math.floor(Date.now() / 1000) + 86400);

    await program.methods
      .createCampaign(goal, deadline)
      .accounts({ creator })
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.creator.toBase58()).toBe(creator.toBase58());
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
        .accounts({ creator: creator.publicKey })
        .signers([creator])
        .rpc(),
    ).rejects.toThrow(/InvalidDeadline/);
  });
});
