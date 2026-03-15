pub mod error;
pub mod event;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use event::*;
pub use instructions::*;
pub use state::*;

declare_id!("3qUXqi2J3W9juVRqZNrwjpH9WPfzx8wHaPAboXVJVPpp");

#[program]
pub mod crowdfunding {
    use super::*;

    /// Creates a new creator profile to launch campaigns.
    ///
    /// # Arguments
    /// * `ctx` - The context of the instruction containing the `CreatorProfile` PDA and creator signer.
    /// * `metadata_uri` - A string representing the URI (e.g., IPFS) for the creator's metadata.
    pub fn create_profile(ctx: Context<CreateProfile>, metadata_uri: String) -> Result<()> {
        create_profile_handler(ctx, metadata_uri)
    }

    /// Updates the metadata URI for an existing creator profile.
    ///
    /// # Arguments
    /// * `ctx` - The context containing the `CreatorProfile` PDA and the creator signer.
    /// * `metadata_uri` - The new metadata URI to store in the profile.
    pub fn update_profile(ctx: Context<UpdateProfile>, metadata_uri: String) -> Result<()> {
        update_profile_handler(ctx, metadata_uri)
    }

    /// Creates a new crowdfunding campaign associated with the creator's profile.
    ///
    /// # Arguments
    /// * `ctx` - The context containing the `CreatorProfile`, the new `Campaign` PDA, and the vault.
    /// * `goal` - The funding goal in lamports.
    /// * `deadline` - The Unix timestamp marking the end of the campaign.
    pub fn create_campaign(ctx: Context<CreateCampaign>, goal: u64, deadline: i64) -> Result<()> {
        create_campaign_handler(ctx, goal, deadline)
    }

    /// Initializes a contribution account for a donor to track their total contributions to a campaign.
    ///
    /// # Arguments
    /// * `ctx` - The context containing the `Campaign`, the new `Contribution` PDA, and the donor signer.
    pub fn initialize_contribution(ctx: Context<InitializeContribution>) -> Result<()> {
        initialize_contribution_handler(ctx)
    }

    /// Contributes lamports to an active campaign.
    ///
    /// # Arguments
    /// * `ctx` - The context containing the `Campaign`, the `Contribution` PDA tracking the donor's balance, and the vault.
    /// * `amount` - The number of lamports to contribute.
    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        contribute_handler(ctx, amount)
    }

    /// Withdraws all raised funds from a successful campaign.
    ///
    /// Can only be called by the creator after the deadline passes and if the raised amount meets or exceeds the goal.
    ///
    /// # Arguments
    /// * `ctx` - The context containing the `Campaign`, the `Vault`, and the creator.
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        withdraw_handler(ctx)
    }

    /// Refunds a donor's contribution from a failed campaign.
    ///
    /// Can only be called by the donor after the deadline passes and if the raised amount did not meet the goal.
    ///
    /// # Arguments
    /// * `ctx` - The context containing the `Campaign`, the `Vault`, and the donor's `Contribution` account.
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        refund_handler(ctx)
    }
}
