use anchor_lang::prelude::*;
use crate::state::{Campaign};
use crate::error::CrowdfundError;

/// Handler for creating a new crowdfunding campaign.
///
/// This function initializes a new `Campaign` account with the specified goal and deadline.
/// It ensures that the deadline is set in the future relative to the current blockchain timestamp.
/// The campaign is associated with the creator's public key and is initialized with zero funds raised.
///
/// # Arguments
///
/// * `ctx` - The context containing all accounts required for campaign creation.
/// * `goal` - The funding goal for the campaign (in lamports).
/// * `deadline` - The UNIX timestamp by which the campaign must reach its goal.
///
/// # Errors
///
/// Returns a `CrowdfundError::InvalidDeadline` if the provided deadline is not in the future.
///
/// # Example
///
/// ```ignore
/// create_campaign_handler(ctx, 1_000_000, 1_700_000_000)?;
/// ```
pub fn create_campaign_handler(ctx: Context<CreateCampaign>, goal: u64, deadline: i64) -> Result<()> {
    let clock = Clock::get()?;

    require!(deadline > clock.unix_timestamp, CrowdfundError::InvalidDeadline); 

    let campaign = &mut ctx.accounts.campaign;

    campaign.creator = ctx.accounts.creator.key();
    campaign.goal = goal;
    campaign.raised = 0;
    campaign.deadline = deadline;
    campaign.claimed = false;
    campaign.bump = ctx.bumps.campaign;



    msg!("Campaign created with goal: {} and deadline: {}", goal, deadline);

    Ok(())
}

#[derive(Accounts)]
pub struct CreateCampaign<'info> {
    #[account(
        init, 
        payer = creator, 
        space = 8 + Campaign::INIT_SPACE,
        seeds = [b"campaign", creator.key().as_ref()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,


    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}