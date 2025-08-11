use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    ed25519_program,
    instruction::Instruction,
    sysvar::instructions::Instructions as SysInstructions,
};
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use sha2::{Digest, Sha256};

declare_id!("SDMCTRx11111111111111111111111111111111111");

const PDA_SEED: &[u8] = b"sdm_mint_ctrl";
const MAX_SUPPLY: u64 = 5_000_000_000 * 1_000_000; // 5B tokens with 6 decimals
const INITIAL_MINT: u64 = 4_000_000_000 * 1_000_000; // 4B tokens with 6 decimals

#[program]
pub mod mint_controller {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>, 
        admin: Pubkey, 
        quorum: u8,
        oracle_signers: Vec<Pubkey>
    ) -> Result<()> {
        require!(quorum > 0 && quorum <= oracle_signers.len() as u8, CustomError::InvalidQuorum);
        require!(oracle_signers.len() <= 10, CustomError::TooManySigners); // Reasonable limit
        
        let config = &mut ctx.accounts.config;
        config.admin = admin;
        config.quorum = quorum;
        config.mint = ctx.accounts.mint.key();
        config.total_minted = 0;
        config.oracle_signers = oracle_signers;
        config.nonce = 0;
        config.bump = *ctx.bumps.get("config").unwrap();
        
        msg!("SDM Mint Controller initialized with {} signers, quorum: {}", config.oracle_signers.len(), quorum);
        Ok(())
    }

    pub fn mint_initial_supply(ctx: Context<MintInitial>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(config.total_minted == 0, CustomError::InitialMintAlreadyDone);
        
        let seeds = &[
            b"config",
            PDA_SEED,
            &[config.bump]
        ];
        let signer_seeds = &[&seeds[..]];
        
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds
        );
        
        token::mint_to(cpi_ctx, INITIAL_MINT)?;
        config.total_minted = INITIAL_MINT;
        
        msg!("Initial supply minted: {} SDM tokens", INITIAL_MINT);
        Ok(())
    }

    pub fn mint_with_multisig(
        ctx: Context<MintWithSig>, 
        amount: u64, 
        recipient: Pubkey,
        nonce: u64,
        reason: String
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        
        // Validate nonce to prevent replay attacks
        require!(nonce > config.nonce, CustomError::InvalidNonce);
        
        // Check supply limit
        let new_total = config.total_minted.checked_add(amount).ok_or(CustomError::Overflow)?;
        require!(new_total <= MAX_SUPPLY, CustomError::ExceedsMaxSupply);
        
        // Verify ed25519 signatures were validated in previous instructions
        let instructions_sysvar = &ctx.accounts.instructions_sysvar;
        let current_index = instructions_sysvar.load_current_index_checked()?;
        
        // Check that we have enough ed25519 verification instructions before this one
        let mut verified_signers = Vec::new();
        
        for i in 0..current_index {
            let ix = instructions_sysvar.load_instruction_at_checked(i as usize, &ctx.program_id)?;
            if ix.program_id == ed25519_program::ID {
                // Parse ed25519 instruction to extract signer pubkey
                if let Some(signer_pubkey) = parse_ed25519_instruction(&ix) {
                    if config.oracle_signers.contains(&signer_pubkey) {
                        verified_signers.push(signer_pubkey);
                    }
                }
            }
        }
        
        require!(
            verified_signers.len() >= config.quorum as usize, 
            CustomError::QuorumNotReached
        );
        
        // Mint tokens
        let seeds = &[
            b"config",
            PDA_SEED,
            &[config.bump]
        ];
        let signer_seeds = &[&seeds[..]];
        
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds
        );
        
        token::mint_to(cpi_ctx, amount)?;
        
        // Update state
        config.total_minted = new_total;
        config.nonce = nonce;
        
        emit!(MintEvent {
            recipient,
            amount,
            reason,
            nonce,
            signers: verified_signers,
        });
        
        msg!("Minted {} SDM tokens to {}, reason: {}", amount, recipient, reason);
        Ok(())
    }

    pub fn update_oracle_signers(
        ctx: Context<UpdateOracles>, 
        new_signers: Vec<Pubkey>, 
        new_quorum: u8
    ) -> Result<()> {
        require!(new_quorum > 0 && new_quorum <= new_signers.len() as u8, CustomError::InvalidQuorum);
        require!(new_signers.len() <= 10, CustomError::TooManySigners);
        
        let config = &mut ctx.accounts.config;
        config.oracle_signers = new_signers;
        config.quorum = new_quorum;
        
        msg!("Oracle signers updated: {} signers, quorum: {}", config.oracle_signers.len(), new_quorum);
        Ok(())
    }

    pub fn update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = new_admin;
        
        msg!("Admin updated to: {}", new_admin);
        Ok(())
    }

    // For CCIP integration - allows authorized CCIP token pool to mint
    pub fn ccip_mint(ctx: Context<CCIPMint>, amount: u64) -> Result<()> {
        // This would be called by Chainlink's Token Pool
        // Add CCIP-specific authorization logic here
        
        let config = &mut ctx.accounts.config;
        let new_total = config.total_minted.checked_add(amount).ok_or(CustomError::Overflow)?;
        require!(new_total <= MAX_SUPPLY, CustomError::ExceedsMaxSupply);
        
        let seeds = &[
            b"config",
            PDA_SEED,
            &[config.bump]
        ];
        let signer_seeds = &[&seeds[..]];
        
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds
        );
        
        token::mint_to(cpi_ctx, amount)?;
        config.total_minted = new_total;
        
        msg!("CCIP mint: {} tokens", amount);
        Ok(())
    }
}

// Helper function to parse ed25519 instruction
fn parse_ed25519_instruction(ix: &Instruction) -> Option<Pubkey> {
    if ix.data.len() < 32 {
        return None;
    }
    
    // Ed25519 instruction format: first 32 bytes are the public key
    let pubkey_bytes: [u8; 32] = ix.data[0..32].try_into().ok()?;
    Some(Pubkey::new_from_array(pubkey_bytes))
}

#[account]
pub struct Config {
    pub admin: Pubkey,                    // 32
    pub mint: Pubkey,                     // 32
    pub quorum: u8,                       // 1
    pub total_minted: u64,                // 8
    pub oracle_signers: Vec<Pubkey>,      // 4 + (32 * n)
    pub nonce: u64,                       // 8
    pub bump: u8,                         // 1
}

impl Config {
    pub const MAX_SIZE: usize = 8 + 32 + 32 + 1 + 8 + (4 + 32 * 10) + 8 + 1; // ~450 bytes
}

#[derive(Accounts)]
#[instruction(admin: Pubkey, quorum: u8, oracle_signers: Vec<Pubkey>)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = Config::MAX_SIZE,
        seeds = [b"config", PDA_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    /// CHECK: This is the PDA that will be the mint authority
    #[account(
        seeds = [b"config", PDA_SEED],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintInitial<'info> {
    #[account(
        mut,
        seeds = [b"config", PDA_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    
    #[account(mut, address = config.mint)]
    pub mint: Account<'info, Mint>,
    
    /// CHECK: PDA authority
    #[account(
        seeds = [b"config", PDA_SEED],
        bump = config.bump
    )]
    pub mint_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub treasury: Account<'info, TokenAccount>,
    
    #[account(address = config.admin)]
    pub admin: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(amount: u64, recipient: Pubkey, nonce: u64, reason: String)]
pub struct MintWithSig<'info> {
    #[account(
        mut,
        seeds = [b"config", PDA_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    
    /// CHECK: PDA authority
    #[account(
        seeds = [b"config", PDA_SEED],
        bump = config.bump
    )]
    pub mint_authority: UncheckedAccount<'info>,
    
    #[account(mut, address = config.mint)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        token::mint = mint,
        token::authority = recipient
    )]
    pub recipient_account: Account<'info, TokenAccount>,
    
    /// CHECK: Instructions sysvar
    #[account(address = solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateOracles<'info> {
    #[account(
        mut,
        has_one = admin,
        seeds = [b"config", PDA_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(
        mut,
        has_one = admin,
        seeds = [b"config", PDA_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct CCIPMint<'info> {
    #[account(
        mut,
        seeds = [b"config", PDA_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    
    /// CHECK: PDA authority
    #[account(
        seeds = [b"config", PDA_SEED],
        bump = config.bump
    )]
    pub mint_authority: UncheckedAccount<'info>,
    
    #[account(mut, address = config.mint)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,
    
    // TODO: Add CCIP-specific authorization account
    pub ccip_authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[event]
pub struct MintEvent {
    pub recipient: Pubkey,
    pub amount: u64,
    pub reason: String,
    pub nonce: u64,
    pub signers: Vec<Pubkey>,
}

#[error_code]
pub enum CustomError {
    #[msg("Quorum not reached")]
    QuorumNotReached,
    #[msg("Invalid signature")]
    InvalidSignature,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid quorum setting")]
    InvalidQuorum,
    #[msg("Too many signers (max 10)")]
    TooManySigners,
    #[msg("Exceeds maximum supply")]
    ExceedsMaxSupply,
    #[msg("Invalid nonce (must be greater than current)")]
    InvalidNonce,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Initial mint already completed")]
    InitialMintAlreadyDone,
}
