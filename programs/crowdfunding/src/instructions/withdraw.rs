use crate::error::CrowdfundError;
use crate::event::FundsWithdrawn;
use crate::state::Campaign;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, system_instruction};

/// Handles the withdrawal of funds by the campaign creator after a successful crowdfunding campaign.
///
/// This function performs the following checks before allowing withdrawal:
/// - The caller is the campaign creator.
/// - The campaign deadline has passed.
/// - The campaign has reached or exceeded its funding goal.
/// - The funds have not already been claimed.
///
/// Upon passing all checks, it marks the campaign as claimed and transfers the raised funds
/// from the campaign's vault PDA to the creator's account using a signed CPI to the system program.
///
/// # Arguments
///
/// * `ctx` - The context containing all accounts required for withdrawal:
///     - `campaign`: The campaign account holding campaign state.
///     - `vault`: The PDA vault holding raised funds.
///     - `creator`: The campaign creator's signer account.
///     - `system_program`: The system program for lamports transfer.
///
/// # Errors
///
/// Returns a `CrowdfundError` if:
/// - The caller is not the creator.
/// - The deadline has not been reached.
/// - The funding goal has not been met.
/// - The funds have already been claimed.
///
/// # Events
///
/// Emits a log message indicating the funds have been withdrawn, including the campaign ID, creator's public key, and withdrawn amount.
///
pub fn withdraw_handler(ctx: Context<Withdraw>) -> Result<()> {
    let clock = Clock::get()?;

    let campaign_key = ctx.accounts.campaign.key();
    let deadline = ctx.accounts.campaign.deadline;
    let raised = ctx.accounts.campaign.raised;
    let goal = ctx.accounts.campaign.goal;
    let vault_bump = ctx.bumps.vault;

    require!(
        clock.unix_timestamp >= deadline,
        CrowdfundError::DeadlineNotReached
    );
    require!(raised >= goal, CrowdfundError::GoalNotReached);
    require!(
        !ctx.accounts.campaign.claimed,
        CrowdfundError::AlreadyClaimed
    );

    ctx.accounts.campaign.claimed = true;

    invoke_signed(
        &system_instruction::transfer(ctx.accounts.vault.key, ctx.accounts.creator.key, raised),
        &[
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.creator.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[&[b"vault", campaign_key.as_ref(), &[vault_bump]]],
    )?;

    emit!(FundsWithdrawn {
        campaign: campaign_key,
        creator: ctx.accounts.creator.key(),
        amount: raised,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"campaign", campaign.creator.as_ref(), &campaign.campaign_id.to_le_bytes()],
        bump = campaign.bump,
        has_one = creator @ CrowdfundError::Unauthorized,
    )]
    pub campaign: Account<'info, Campaign>,

    /// CHECK: system-owned PDA vault, seeds verified — invoke_signed authorizes transfer
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
