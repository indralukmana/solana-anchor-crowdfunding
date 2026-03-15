use anchor_lang::prelude::*;

/// State account representing a creator's registered profile.
/// Pda seeded by `[b"profile", creator.key().as_ref()]`.
#[account]
#[derive(InitSpace)]
pub struct CreatorProfile {
    /// The public key of the creator who registered this profile.
    pub creator: Pubkey,
    /// The total number of campaigns launched by this creator, used as sequential IDs.
    pub campaign_count: u64,
    /// A string URI (e.g., IPFS) linking to the creator's off-chain JSON metadata.
    #[max_len(200)]
    pub metadata_uri: String, // IPFS/Arweave URI/DB → off-chain JSON
    /// Bump seed for PDA derivation.
    pub bump: u8,
}
