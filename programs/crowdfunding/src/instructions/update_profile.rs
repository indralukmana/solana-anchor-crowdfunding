use crate::error::CrowdfundError;
use crate::state::CreatorProfile;
use anchor_lang::prelude::*;

/// Updates the metadata URI of a creator's profile.
///
/// # Arguments
///
/// * `ctx` - The context containing the accounts required for updating the profile.
/// * `metadata_uri` - The new metadata URI to be set for the creator's profile. Must not exceed 200 characters.
///
/// # Errors
///
/// Returns a [`CrowdfundError::UriTooLong`] error if the provided `metadata_uri` exceeds 200 characters.
///
/// # Account Constraints
///
/// * The `profile` account must be derived from the creator's public key and must have the correct bump seed.
/// * The `profile` account must have the `creator` as its owner.
/// * The `creator` account must sign the transaction and be mutable.
///
/// # Events
///
/// Emits a log message indicating the profile has been updated for the given creator.

pub fn update_profile_handler(ctx: Context<UpdateProfile>, metadata_uri: String) -> Result<()> {
    require!(metadata_uri.len() <= 200, CrowdfundError::UriTooLong);

    ctx.accounts.profile.metadata_uri = metadata_uri;

    msg!("Profile updated for {}", ctx.accounts.creator.key());
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(
        mut,
        seeds = [b"profile", creator.key().as_ref()],
        bump = profile.bump,
        has_one = creator @ CrowdfundError::Unauthorized,
    )]
    pub profile: Account<'info, CreatorProfile>,

    #[account(mut)]
    pub creator: Signer<'info>,
}
