use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CreatorProfile {
    pub creator: Pubkey,
    pub campaign_count: u64,
    #[max_len(200)]
    pub metadata_uri: String, // IPFS/Arweave URI/DB → off-chain JSON
    pub bump: u8,
}
