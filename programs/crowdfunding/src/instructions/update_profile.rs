use crate::error::CrowdfundError;
use crate::state::CreatorProfile;
use anchor_lang::prelude::*;

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
        has_one = creator,
    )]
    pub profile: Account<'info, CreatorProfile>,

    #[account(mut)]
    pub creator: Signer<'info>,
}
