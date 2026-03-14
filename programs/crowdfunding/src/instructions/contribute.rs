use crate::error::CrowdfundError;
use crate::state::{Campaign, Contribution};
use anchor_lang::prelude::*;
use anchor_lang::system_program;

/// Handles a contribution to a crowdfunding campaign.
///
/// This handler performs the following steps:
/// 1. Checks that the campaign deadline has not passed.
/// 2. Calculates the remaining amount needed to reach the campaign goal,
///    and ensures the contribution does not exceed this amount.
/// 3. Transfers the effective contribution amount from the donor to the campaign's vault.
/// 4. Updates the campaign's raised amount and the donor's contribution record.
///
/// # Arguments
/// * `ctx` - The context containing all accounts required for the contribution.
/// * `amount` - The amount (in lamports) the donor wishes to contribute.
///
/// # Errors
/// Returns a [`CrowdfundError::DeadlinePassed`] if the campaign deadline has passed.
/// Returns a [`CrowdfundError::GoalAlreadyReached`] if the campaign goal has already been met.
///
/// # Events
/// Emits a log message with the contributed amount and the new total raised.
pub fn contribute_handler(ctx: Context<Contribute>, amount: u64) -> Result<()> {
    let clock = Clock::get()?;

    let deadline = ctx.accounts.campaign.deadline;
    let goal = ctx.accounts.campaign.goal;
    let raised = ctx.accounts.campaign.raised;
    let campaign_key = ctx.accounts.campaign.key();
    let donor_key = ctx.accounts.donor.key();

    require!(
        clock.unix_timestamp < deadline,
        CrowdfundError::DeadlinePassed
    );

    let remaining = goal.saturating_sub(raised);
    let effective_amount = amount.min(remaining);
    require!(effective_amount > 0, CrowdfundError::GoalAlreadyReached);

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.donor.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        effective_amount,
    )?;

    ctx.accounts.campaign.raised = raised.saturating_add(effective_amount);
    ctx.accounts.contribution.donor = donor_key;
    ctx.accounts.contribution.campaign = campaign_key;
    ctx.accounts.contribution.amount = ctx
        .accounts
        .contribution
        .amount
        .saturating_add(effective_amount);

    msg!(
        "Contributed: {} lamports, total={}",
        effective_amount,
        ctx.accounts.campaign.raised
    );
    Ok(())
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(
        mut,
        seeds = [b"campaign", campaign.creator.as_ref()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        init_if_needed,
        payer = donor,
        space = 8 + Contribution::INIT_SPACE,
        seeds = [b"contribution", campaign.key().as_ref(), donor.key().as_ref()],
        bump,
    )]
    pub contribution: Account<'info, Contribution>,

    /// CHECK: system-owned PDA vault, seeds verified — system program creates on first transfer
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub donor: Signer<'info>,
    pub system_program: Program<'info, System>,
}
