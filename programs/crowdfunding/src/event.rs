use anchor_lang::prelude::*;

#[event]
pub struct ProfileCreated {
    pub creator: Pubkey,
    pub metadata_uri: String,
}

#[event]
pub struct ProfileUpdated {
    pub creator: Pubkey,
    pub metadata_uri: String,
}

#[event]
pub struct CampaignCreated {
    pub creator: Pubkey,
    pub campaign: Pubkey,
    pub campaign_id: u64,
    pub goal: u64,
    pub deadline: i64,
}

#[event]
pub struct ContributionInitialized {
    pub campaign: Pubkey,
    pub donor: Pubkey,
}

#[event]
pub struct ContributionMade {
    pub campaign: Pubkey,
    pub donor: Pubkey,
    pub amount: u64,
    pub total_raised: u64,
}

#[event]
pub struct FundsWithdrawn {
    pub campaign: Pubkey,
    pub creator: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RefundIssued {
    pub campaign: Pubkey,
    pub donor: Pubkey,
    pub amount: u64,
}
