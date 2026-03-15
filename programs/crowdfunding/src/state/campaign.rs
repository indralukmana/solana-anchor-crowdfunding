use anchor_lang::prelude::*;

/// State account representing an active or completed crowdfunding campaign.
/// Pda seeded by `[b"campaign", creator.key().as_ref(), &campaign_id.to_le_bytes()]`.
#[account]
#[derive(InitSpace)]
pub struct Campaign {
    /// The public key of the creator who launched this campaign.
    pub creator: Pubkey,
    /// The sequential ID of the campaign, specific to this creator.
    pub campaign_id: u64,
    /// The target amount of lamports the campaign aims to raise.
    pub goal: u64,
    /// The total amount of lamports raised so far.
    pub raised: u64,
    /// The Unix timestamp marking the end of the campaign, after which no contributions are accepted.
    pub deadline: i64,
    /// Whether the funds have been successfully claimed by the creator.
    pub claimed: bool,
    /// Bump seed for PDA derivation.
    pub bump: u8,
}
