use crate::event::ContributionInitialized;
use crate::state::{Campaign, Contribution};
use anchor_lang::prelude::*;

/// Initializes a contribution account for a donor to a campaign.
///
/// This instruction must be called by a donor before they can contribute to a campaign.
/// It creates a new `Contribution` account that will store the donor's contributions to the campaign.
///
/// # Arguments
/// * `ctx` - The context containing all accounts required for the initialization.
///
/// # Events
///
/// Emits a log message indicating a contribution has been initialized, including the campaign ID and donor's public key.
pub fn initialize_contribution_handler(ctx: Context<InitializeContribution>) -> Result<()> {
    let campaign_key = ctx.accounts.campaign.key();
    let donor_key = ctx.accounts.donor.key();

    ctx.accounts.contribution.donor = donor_key;
    ctx.accounts.contribution.campaign = campaign_key;
    ctx.accounts.contribution.amount = 0;

    emit!(ContributionInitialized {
        campaign: campaign_key,
        donor: donor_key,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeContribution<'info> {
    #[account(
        seeds = [b"campaign", campaign.creator.as_ref(), &campaign.campaign_id.to_le_bytes()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        init,
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
