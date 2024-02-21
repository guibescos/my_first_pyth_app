use anchor_lang::prelude::Pubkey;
use anchor_lang::prelude::*;
use pyth_solana_receiver_state::price_update::{PriceUpdateV1, VerificationLevel};
use solana_program::pubkey;

declare_id!("2e5gZD3suxgJgkCg4pkoogxDKszy1SAwokz8mNeZUj4M");

pub const MAXIMUM_AGE: u64 = 24 * 3600 * 365;
pub const FEED_ID: Pubkey = pubkey!("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");

#[program]
pub mod my_first_pyth_app {

    use anchor_lang::solana_program::{native_token::LAMPORTS_PER_SOL, system_instruction};

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, amount_in_usd: u64) -> Result<()> {
        let price_update = &mut ctx.accounts.price_update;
        let price = price_update.get_price_no_older_than(&Clock::get()?, MAXIMUM_AGE, &FEED_ID)?;

        let amount_in_lamports = LAMPORTS_PER_SOL
            .checked_mul(10_u64.pow(price.exponent.abs().try_into().unwrap()))
            .unwrap()
            .checked_mul(amount_in_usd)
            .unwrap()
            .checked_div(price.price.try_into().unwrap())
            .unwrap();

        let transfer_instruction = system_instruction::transfer(
            ctx.accounts.payer.key,
            ctx.accounts.destination.key,
            amount_in_lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[ctx.accounts.payer.to_account_info(), ctx.accounts.destination.to_account_info()],
        )?;
        
        

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount_in_usd : u64)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    /// CHECK : Just a destination
    pub destination: AccountInfo<'info>,
    pub price_update: Account<'info, PriceUpdateV1>,
    pub system_program: Program<'info, System>,
}
