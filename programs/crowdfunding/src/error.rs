use anchor_lang::prelude::*;

#[error_code]
pub enum CrowdfundError {
    #[msg("Deadline must be in the future")]
    InvalidDeadline,
    #[msg("Campaign deadline has not passed")]
    DeadlineNotReached,
    #[msg("Campaign deadline has passed")]
    DeadlinePassed,
    #[msg("Goal not reached")]
    GoalNotReached,
    #[msg("Goal already reached")]
    GoalAlreadyReached,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Not the campaign creator")]
    Unauthorized,
    #[msg("Nothing to refund")]
    NothingToRefund,
    #[msg("Metadata URI exceeds maximum length of 200 characters")]
    UriTooLong,
    #[msg("Contribution amount must be greater than zero")]
    ZeroAmount,
    #[msg("Campaign count overflow")]
    CampaignCountOverflow,
}
