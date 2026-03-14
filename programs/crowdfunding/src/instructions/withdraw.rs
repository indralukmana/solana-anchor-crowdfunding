use crate::error::CrowdfundError;
use crate::state::Campaign;
use anchor_lang::prelude::*;

/// Handles the withdrawal of funds from a successfully completed crowdfunding campaign.
///
/// This function performs the following checks before allowing withdrawal:
/// - Ensures the caller is the campaign creator.
/// - Ensures the campaign deadline has passed.
/// - Ensures the campaign's funding goal has been reached.
/// - Ensures the funds have not already been claimed.
///
/// If all checks pass, it transfers all lamports from the campaign's vault PDA to the creator's account,
/// marks the campaign as claimed, and logs the withdrawal amount.
///
/// # Arguments
///
/// * `ctx` - The context containing all accounts required for withdrawal:
///     - `campaign`: The campaign account (must match the creator and be derived from the correct seeds).
///     - `vault`: The PDA holding the campaign's funds.
///     - `creator`: The campaign creator (must sign the transaction).
///     - `system_program`: The Solana system program.
///
/// # Errors
///
/// Returns a `CrowdfundError` if:
/// - The caller is not the creator.
/// - The deadline has not been reached.
/// - The funding goal has not been met.
/// - The funds have already been claimed.
///
pub fn withdraw_handler(ctx: Context<Withdraw>) -> Result<()> {
    let clock = Clock::get()?;
    let campaign = &mut ctx.accounts.campaign;

    require!(
        ctx.accounts.creator.key() == campaign.creator,
        CrowdfundError::Unauthorized
    );
    require!(
        clock.unix_timestamp >= campaign.deadline,
        CrowdfundError::DeadlineNotReached
    );
    require!(
        campaign.raised >= campaign.goal,
        CrowdfundError::GoalNotReached
    );
    require!(!campaign.claimed, CrowdfundError::AlreadyClaimed);

    let amount = ctx.accounts.vault.lamports();

    **ctx.accounts.vault.try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.creator.try_borrow_mut_lamports()? += amount;

    campaign.claimed = true;
    msg!("Withdrawn: {} lamports", amount);
    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
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

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}
