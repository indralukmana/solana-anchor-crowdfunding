use anchor_lang::prelude::*;

/// Event emitted when a new creator profile is successfully registered.
#[event]
pub struct ProfileCreated {
    /// The public key of the creator who registered the profile.
    pub creator: Pubkey,
    /// The URI linking to the creator's metadata.
    pub metadata_uri: String,
}

/// Event emitted when a creator updates their profile's metadata URI.
#[event]
pub struct ProfileUpdated {
    /// The public key of the creator who updated the profile.
    pub creator: Pubkey,
    /// The new URI linking to the creator's updated metadata.
    pub metadata_uri: String,
}

/// Event emitted when a new crowdfunding campaign is launched.
#[event]
pub struct CampaignCreated {
    /// The public key of the creator who launched the campaign.
    pub creator: Pubkey,
    /// The public key of the newly created Campaign PDA.
    pub campaign: Pubkey,
    /// The sequential ID assigned to this campaign.
    pub campaign_id: u64,
    /// The target funding goal in lamports.
    pub goal: u64,
    /// The Unix timestamp marking when the campaign ends.
    pub deadline: i64,
}

/// Event emitted when a donor initializes their contribution tracking account.
#[event]
pub struct ContributionInitialized {
    /// The public key of the campaign being contributed to.
    pub campaign: Pubkey,
    /// The public key of the donor.
    pub donor: Pubkey,
}

/// Event emitted when a donor successfully contributes lamports to an active campaign.
#[event]
pub struct ContributionMade {
    /// The public key of the campaign that received the contribution.
    pub campaign: Pubkey,
    /// The public key of the donor who made the contribution.
    pub donor: Pubkey,
    /// The amount of lamports contributed in this transaction.
    pub amount: u64,
    /// The new total amount of lamports raised by the campaign so far.
    pub total_raised: u64,
}

/// Event emitted when a creator successfully withdraws all raised funds from a completed campaign.
#[event]
pub struct FundsWithdrawn {
    /// The public key of the campaign funds were withdrawn from.
    pub campaign: Pubkey,
    /// The public key of the creator who received the funds.
    pub creator: Pubkey,
    /// The total amount of lamports withdrawn.
    pub amount: u64,
}

/// Event emitted when a donor reclaims their contribution from a failed campaign.
#[event]
pub struct RefundIssued {
    /// The public key of the failed campaign.
    pub campaign: Pubkey,
    /// The public key of the donor who received the refund.
    pub donor: Pubkey,
    /// The total amount of lamports refunded to the donor.
    pub amount: u64,
}
