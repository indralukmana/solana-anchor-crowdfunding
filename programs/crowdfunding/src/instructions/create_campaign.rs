use anchor_lang::prelude::*;
use crate::state::Campaign;
use crate::error::CrowdfundError;

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