use crate::error::CrowdfundError;
use crate::state::CreatorProfile;
use anchor_lang::prelude::*;

/// Handles the creation of a new creator profile.
///
/// This function initializes a new `CreatorProfile` account with the provided metadata URI,
/// sets the creator's public key, initializes the campaign count to zero, and stores the bump seed.
/// It enforces a maximum length of 200 characters for the metadata URI.
///
/// # Arguments
///
/// * `ctx` - The context containing all accounts required for profile creation.
/// * `metadata_uri` - A string containing the URI to the creator's metadata.
///
/// # Errors
///
/// Returns a `CrowdfundError::UriTooLong` error if the `metadata_uri` exceeds 200 characters.
///
/// # Events
///
/// Emits a log message indicating successful profile creation.
pub fn create_profile_handler(ctx: Context<CreateProfile>, metadata_uri: String) -> Result<()> {
    require!(metadata_uri.len() <= 200, CrowdfundError::UriTooLong);

    let profile = &mut ctx.accounts.profile;
    profile.creator = ctx.accounts.creator.key();
    profile.campaign_count = 0;
    profile.metadata_uri = metadata_uri;
    profile.bump = ctx.bumps.profile;

    msg!("Profile created for {}", ctx.accounts.creator.key());
    Ok(())
}

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + CreatorProfile::INIT_SPACE,
        seeds = [b"profile", creator.key().as_ref()],
        bump,
    )]
    pub profile: Account<'info, CreatorProfile>,

    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}
