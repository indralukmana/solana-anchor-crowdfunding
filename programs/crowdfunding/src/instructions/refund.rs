use crate::error::CrowdfundError;
use crate::state::{Campaign, Contribution};
use anchor_lang::prelude::*;

/// Processes a refund for a donor if the crowdfunding campaign has ended without reaching its goal.
///
/// This handler performs the following checks and actions:
/// - Ensures the campaign deadline has passed.
/// - Ensures the campaign did not reach its funding goal.
/// - Ensures the donor has a non-zero contribution to refund.
/// - Transfers the donor's contributed lamports from the campaign's vault back to the donor.
/// - Sets the donor's contribution amount to zero after refunding.
///
/// # Arguments
///
/// * `ctx` - The context containing all accounts required for the refund operation.
///
/// # Errors
///
/// Returns a `CrowdfundError` if:
/// - The campaign deadline has not been reached.
/// - The campaign goal has already been reached.
/// - There is nothing to refund for the donor.
///
pub fn refund_handler(ctx: Context<Refund>) -> Result<()> {
    let clock = Clock::get()?;
    let campaign = &ctx.accounts.campaign;

    require!(
        clock.unix_timestamp >= campaign.deadline,
        CrowdfundError::DeadlineNotReached
    );
    require!(
        campaign.raised < campaign.goal,
        CrowdfundError::GoalAlreadyReached
    );
    require!(
        ctx.accounts.contribution.amount > 0,
        CrowdfundError::NothingToRefund
    );

    let refund_amount = ctx.accounts.contribution.amount;

    // Drain vault to donor
    **ctx.accounts.vault.try_borrow_mut_lamports()? -= refund_amount;
    **ctx.accounts.donor.try_borrow_mut_lamports()? += refund_amount;

    // contribution account is closed via `close = donor` constraint below
    msg!("Refunded: {} lamports", refund_amount);
    Ok(())
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(
        mut,
        seeds = [b"campaign", campaign.creator.as_ref()],
        bump = campaign.bump
    )]
    pub campaign: Account<'info, Campaign>,

    /// CHECK: PDA vault owned by this program, holds lamports only
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub vault: UncheckedAccount<'info>,

    #[account(
        mut,
        close = donor,  // sends rent lamports to donor, closes account
        seeds = [b"contribution", campaign.key().as_ref(), donor.key().as_ref()],
        bump
    )]
    pub contribution: Account<'info, Contribution>,

    #[account(mut)]
    pub donor: Signer<'info>,
    pub system_program: Program<'info, System>,
}
