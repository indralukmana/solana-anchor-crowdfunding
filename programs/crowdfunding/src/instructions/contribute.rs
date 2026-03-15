use crate::error::CrowdfundError;
use crate::event::ContributionMade;
use crate::state::{Campaign, Contribution};
use anchor_lang::prelude::*;
use anchor_lang::system_program;

/// Handles a contribution to a crowdfunding campaign.
///
/// Transfers the full requested amount from the donor to the campaign vault.
/// Overfunding is allowed — contributions are accepted as long as the deadline
/// has not passed. The raised amount accumulates without a ceiling.
///
/// # Arguments
/// * `ctx` - The context containing all accounts required for the contribution.
/// * `amount` - The amount of lamports the donor wishes to contribute.
///
/// # Errors
/// Returns [`CrowdfundError::ZeroAmount`] if amount is zero.
/// Returns [`CrowdfundError::DeadlinePassed`] if the campaign deadline has passed.
///
/// # Events
///
/// Emits a log message indicating a contribution has been made, including the campaign ID, donor's public key, contributed amount, and total raised amount after the contribution.
///
pub fn contribute_handler(ctx: Context<Contribute>, amount: u64) -> Result<()> {
    let clock = Clock::get()?;

    let deadline = ctx.accounts.campaign.deadline;
    let campaign_key = ctx.accounts.campaign.key();
    let donor_key = ctx.accounts.donor.key();

    require!(amount > 0, CrowdfundError::ZeroAmount);
    require!(
        clock.unix_timestamp < deadline,
        CrowdfundError::DeadlinePassed
    );

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.donor.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        amount,
    )?;

    ctx.accounts.campaign.raised = ctx.accounts.campaign.raised.saturating_add(amount);

    // Contribution account is guaranteed to be initialized with these fields already set.
    ctx.accounts.contribution.amount = ctx.accounts.contribution.amount.saturating_add(amount);

    emit!(ContributionMade {
        campaign: campaign_key,
        donor: donor_key,
        amount,
        total_raised: ctx.accounts.campaign.raised,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(
        mut,
        seeds = [b"campaign", campaign.creator.as_ref(), &campaign.campaign_id.to_le_bytes()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        mut,
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
