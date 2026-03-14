use crate::error::CrowdfundError;
use crate::state::{Campaign, Contribution};
use anchor_lang::prelude::*;
use anchor_lang::system_program;

/// Handles a contribution to a crowdfunding campaign.
///
/// This handler performs the following steps:
/// 1. Checks that the campaign deadline has not passed.
/// 2. Calculates the effective contribution amount, ensuring the campaign is not overfunded.
/// 3. Transfers the effective amount of lamports from the donor to the campaign's account.
/// 4. Updates the campaign's raised amount.
/// 5. Initializes or updates the donor's contribution account for this campaign.
///
/// # Arguments
/// * `ctx` - The context containing all relevant accounts for the contribution.
/// * `amount` - The amount of lamports the donor wishes to contribute.
///
/// # Errors
/// Returns an error if:
/// - The campaign deadline has passed.
/// - The campaign goal has already been reached.
/// - The transfer of lamports fails.
///
pub fn contribute_handler(ctx: Context<Contribute>, amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    let campaign = &mut ctx.accounts.campaign;

    require!(
        clock.unix_timestamp < campaign.deadline,
        CrowdfundError::DeadlinePassed
    );

    let remaining = campaign.goal.saturating_sub(campaign.raised);
    let effective_amount = amount.min(remaining);

    require!(effective_amount > 0, CrowdfundError::GoalAlreadyReached);

    // Transfer only the effective amount to avoid overfunding
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.donor.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);
    system_program::transfer(cpi_ctx, effective_amount)?;

    // Update campaign state
    campaign.raised += effective_amount;

    let contribution = &mut ctx.accounts.contribution;
    // Initialize contribution account
    contribution.donor = ctx.accounts.donor.key();
    contribution.amount = contribution.amount.saturating_add(effective_amount);
    contribution.campaign = campaign.key();

    msg!(
        "Contribution of {} lamports made to campaign by {}",
        effective_amount,
        ctx.accounts.donor.key()
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

    /// CHECK: PDA vault owned by this program, holds lamports only
    #[account(
        init_if_needed,
        payer = donor,
        space = 0,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub vault: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = donor,
        space = 8 + Contribution::INIT_SPACE,
        seeds = [b"contribution", campaign.key().as_ref(), donor.key().as_ref()],
        bump,
    )]
    pub contribution: Account<'info, Contribution>,

    #[account(mut)]
    pub donor: Signer<'info>,

    pub system_program: Program<'info, System>,
}
