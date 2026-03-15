use crate::error::CrowdfundError;
use crate::event::CampaignCreated;
use crate::state::{Campaign, CreatorProfile};
use anchor_lang::prelude::*;
use anchor_lang::system_program;

/// Handles the creation of a new crowdfunding campaign.
///
/// This function initializes a new `Campaign` account with the specified goal and deadline,
/// associating it with the creator's profile. It ensures the deadline is set in the future,
/// increments the creator's campaign count, and sets up the campaign's initial state.
///
/// # Arguments
///
/// * `ctx` - The context containing all accounts required for campaign creation.
/// * `goal` - The funding goal for the campaign (in lamports).
/// * `deadline` - The UNIX timestamp by which the campaign must be funded.
///
/// # Errors
///
/// Returns a `CrowdfundError::InvalidDeadline` if the provided deadline is not in the future.
///
/// # Events
///
/// Emits a log message indicating successful campaign creation, including the creator's public key, campaign ID, goal, and deadline.
///
pub fn create_campaign_handler(
    ctx: Context<CreateCampaign>,
    goal: u64,
    deadline: i64,
) -> Result<()> {
    let clock = Clock::get()?;
    require!(
        deadline > clock.unix_timestamp,
        CrowdfundError::InvalidDeadline
    );

    let campaign_id = ctx.accounts.profile.campaign_count;

    // Increment counter for next campaign
    ctx.accounts.profile.campaign_count = ctx
        .accounts
        .profile
        .campaign_count
        .checked_add(1)
        .ok_or(CrowdfundError::CampaignCountOverflow)?;

    let rent = Rent::get()?;
    let vault_rent = rent.minimum_balance(0);

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        vault_rent,
    )?;

    let campaign = &mut ctx.accounts.campaign;
    campaign.creator = ctx.accounts.creator.key();
    campaign.campaign_id = campaign_id;
    campaign.goal = goal;
    campaign.raised = 0;
    campaign.deadline = deadline;
    campaign.claimed = false;
    campaign.bump = ctx.bumps.campaign;

    emit!(CampaignCreated {
        creator: ctx.accounts.creator.key(),
        campaign: ctx.accounts.campaign.key(),
        campaign_id,
        goal,
        deadline,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct CreateCampaign<'info> {
    // Profile must already exist — no init_if_needed
    #[account(
        mut,
        seeds = [b"profile", creator.key().as_ref()],
        bump = profile.bump,
        has_one = creator @ CrowdfundError::Unauthorized,
    )]
    pub profile: Account<'info, CreatorProfile>,

    #[account(
        init,
        payer = creator,
        space = 8 + Campaign::INIT_SPACE,
        seeds = [b"campaign", creator.key().as_ref(), &profile.campaign_count.to_le_bytes()],
        bump,
    )]
    pub campaign: Account<'info, Campaign>,

    /// CHECK: vault account for campaign funds, seeded with rent-exemption
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}
