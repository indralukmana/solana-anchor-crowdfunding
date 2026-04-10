use anchor_lang::prelude::*;

/// State account tracking a donor's total contributions to a specific campaign.
/// Pda seeded by `[b"contribution", campaign.key().as_ref(), donor.key().as_ref()]`.
#[account]
#[derive(InitSpace)]
pub struct Contribution {
    /// The public key of the donor who made the contribution.
    pub donor: Pubkey,
    /// The total amount of lamports contributed by the donor to this campaign.
    pub amount: u64,
    /// The public key of the campaign the contribution is directed towards.
    pub campaign: Pubkey,
}
