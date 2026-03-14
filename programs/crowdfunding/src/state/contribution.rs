use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Contribution {
    pub donor: Pubkey,
    pub amount: u64,
    pub campaign: Pubkey,
}
