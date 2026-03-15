use anchor_lang::prelude::*;

/// Custom error codes for the Crowdfunding program.
#[error_code]
pub enum CrowdfundError {
    /// The specified deadline is not in the future.
    #[msg("Deadline must be in the future")]
    InvalidDeadline,
    /// An action was attempted before the campaign deadline had passed.
    #[msg("Campaign deadline has not passed")]
    DeadlineNotReached,
    /// Contributions are no longer accepted because the deadline has passed.
    #[msg("Campaign deadline has passed")]
    DeadlinePassed,
    /// The creator attempted to withdraw funds, but the funding goal was not met.
    #[msg("Goal not reached")]
    GoalNotReached,
    /// A donor attempted to refund, but the funding goal had already been met.
    #[msg("Goal already reached")]
    GoalAlreadyReached,
    /// The funds have already been claimed by the creator.
    #[msg("Already claimed")]
    AlreadyClaimed,
    /// An unauthorized user attempted to perform an action restricted to the creator.
    #[msg("Not the campaign creator")]
    Unauthorized,
    /// A refund was requested, but the donor has no contribution amount to refund.
    #[msg("Nothing to refund")]
    NothingToRefund,
    /// The provided metadata URI exceeds the 200 character limit.
    #[msg("Metadata URI exceeds maximum length of 200 characters")]
    UriTooLong,
    /// The contribution amount must be greater than zero.
    #[msg("Must be greater than zero")]
    ZeroAmount,
    /// The creator's campaign count has reached its maximum value.
    #[msg("Campaign count overflow")]
    CampaignCountOverflow,
}
