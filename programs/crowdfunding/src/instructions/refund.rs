use crate::error::CrowdfundError;
use crate::state::{Campaign, Contribution};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, system_instruction};

/// Processes a refund for a donor in a crowdfunding campaign.
///
/// This handler allows a donor to reclaim their contributed funds if the campaign's deadline
/// has passed and the funding goal was not reached. The function performs the following checks:
/// - Ensures the campaign deadline has been reached.
/// - Ensures the campaign did not meet its funding goal.
/// - Ensures there is a non-zero amount to refund.
///
/// If all checks pass, the handler transfers the contributed amount from the campaign's vault
/// (a program-derived address) back to the donor using a signed CPI to the system program.
/// The donor's `Contribution` account is closed and its lamports are refunded to the donor.
///
/// # Arguments
///
/// * `ctx` - The context containing all accounts required for the refund operation.
///
/// # Errors
///
/// Returns a `CrowdfundError` if:
/// - The deadline has not been reached.
/// - The campaign goal has already been reached.
/// - There is nothing to refund.
///
/// # Events
///
/// Emits a log message indicating the amount refunded.
pub fn refund_handler(ctx: Context<Refund>) -> Result<()> {
    let clock = Clock::get()?;

    let campaign_key = ctx.accounts.campaign.key();
    let deadline = ctx.accounts.campaign.deadline;
    let raised = ctx.accounts.campaign.raised;
    let goal = ctx.accounts.campaign.goal;
    let refund_amount = ctx.accounts.contribution.amount;
    let vault_bump = ctx.bumps.vault;

    require!(
        clock.unix_timestamp >= deadline,
        CrowdfundError::DeadlineNotReached
    );
    require!(raised < goal, CrowdfundError::GoalAlreadyReached);
    require!(refund_amount > 0, CrowdfundError::NothingToRefund);

    invoke_signed(
        &system_instruction::transfer(
            ctx.accounts.vault.key,
            ctx.accounts.donor.key,
            refund_amount,
        ),
        &[
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.donor.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[&[b"vault", campaign_key.as_ref(), &[vault_bump]]],
    )?;

    msg!("Refunded: {} lamports", refund_amount);
    Ok(())
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(
        mut,
        seeds = [b"campaign", campaign.creator.as_ref()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,

    /// CHECK: system-owned PDA vault, seeds verified — invoke_signed authorizes transfer
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub vault: UncheckedAccount<'info>,

    #[account(
        mut,
        close = donor,
        seeds = [b"contribution", campaign.key().as_ref(), donor.key().as_ref()],
        bump,
    )]
    pub contribution: Account<'info, Contribution>,

    #[account(mut)]
    pub donor: Signer<'info>,
    pub system_program: Program<'info, System>,
}
