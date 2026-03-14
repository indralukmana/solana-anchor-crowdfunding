pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;
pub use state::*;

declare_id!("HysEQZD4Uz2v97vpPrysELouuHCMpmn98YwKfJ9u77XD");

#[program]
pub mod crowdfunding {
    use super::*;

    pub fn create_campaign(ctx: Context<CreateCampaign>, goal: u64, deadline: i64) -> Result<()> {
        create_campaign_handler(ctx, goal, deadline)
    }

    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        contribute_handler(ctx, amount)
    }
}
