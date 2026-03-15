pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;
pub use state::*;

declare_id!("3qUXqi2J3W9juVRqZNrwjpH9WPfzx8wHaPAboXVJVPpp");

#[program]
pub mod crowdfunding {
    use super::*;

    pub fn create_profile(ctx: Context<CreateProfile>, metadata_uri: String) -> Result<()> {
        create_profile_handler(ctx, metadata_uri)
    }

    pub fn create_campaign(ctx: Context<CreateCampaign>, goal: u64, deadline: i64) -> Result<()> {
        create_campaign_handler(ctx, goal, deadline)
    }

    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        contribute_handler(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        withdraw_handler(ctx)
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        refund_handler(ctx)
    }
}
