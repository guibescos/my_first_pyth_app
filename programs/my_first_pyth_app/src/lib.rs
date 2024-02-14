use anchor_lang::prelude::*;
use pyth_solana_receiver::state::price_update::PriceUpdateV1;

declare_id!("56o3NWoUrmEz4jrkrxXnTcUem7PYNwes9trxPGMfc2yR");

#[program]
pub mod my_first_pyth_app {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub price_update : Account<'info, PriceUpdateV1>
}
