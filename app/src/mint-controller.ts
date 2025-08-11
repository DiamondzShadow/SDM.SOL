import * as anchor from "@project-serum/anchor"
import type { Program } from "@project-serum/anchor"
import { PublicKey, type Keypair, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, createMint } from "@solana/spl-token"
import type { MintController } from "./types"

export class SDMMintController {
  private program: Program<MintController>
  private configPDA: PublicKey
  private mintAuthorityPDA: PublicKey

  constructor(
    program: Program<MintController>,
    private provider: anchor.AnchorProvider,
  ) {
    this.program = program

    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), Buffer.from("sdm_mint_ctrl")],
      program.programId,
    )
    this.configPDA = configPDA
    this.mintAuthorityPDA = configPDA // Same PDA serves as both config and mint authority
  }

  async initialize(admin: PublicKey, mint: PublicKey, quorum: number, oracleSigners: PublicKey[]) {
    return await this.program.methods
      .initialize(admin, quorum, oracleSigners)
      .accounts({
        config: this.configPDA,
        mint: mint,
        mintAuthority: this.mintAuthorityPDA,
        payer: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
  }

  async mintInitialSupply(mint: PublicKey, treasury: PublicKey, admin: Keypair) {
    return await this.program.methods
      .mintInitialSupply()
      .accounts({
        config: this.configPDA,
        mint: mint,
        mintAuthority: this.mintAuthorityPDA,
        treasury: treasury,
        admin: admin.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin])
      .rpc()
  }

  async mintWithMultisig(
    amount: anchor.BN,
    recipient: PublicKey,
    recipientTokenAccount: PublicKey,
    mint: PublicKey,
    nonce: anchor.BN,
    reason: string,
    signatures: { signature: Uint8Array; signer: PublicKey }[],
  ) {
    // Create ed25519 verification instructions
    const ed25519Instructions = signatures.map(({ signature, signer }) => {
      return anchor.web3.Ed25519Program.createInstructionWithPublicKey({
        publicKey: signer.toBytes(),
        message: this.createMintMessage(amount, recipient, nonce, reason),
        signature: signature,
      })
    })

    const mintInstruction = await this.program.methods
      .mintWithMultisig(amount, recipient, nonce, reason)
      .accounts({
        config: this.configPDA,
        mintAuthority: this.mintAuthorityPDA,
        mint: mint,
        recipientAccount: recipientTokenAccount,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction()

    const tx = new anchor.web3.Transaction().add(...ed25519Instructions).add(mintInstruction)

    return await this.provider.sendAndConfirm(tx)
  }

  private createMintMessage(amount: anchor.BN, recipient: PublicKey, nonce: anchor.BN, reason: string): Uint8Array {
    const message = Buffer.concat([
      amount.toBuffer("le", 8),
      recipient.toBuffer(),
      nonce.toBuffer("le", 8),
      Buffer.from(reason, "utf8"),
    ])
    return new Uint8Array(message)
  }

  async getConfig(): Promise<any> {
    return await this.program.account.config.fetch(this.configPDA)
  }
}

// Helper function to create SDM token mint
export async function createSDMToken(
  provider: anchor.AnchorProvider,
  mintAuthority: PublicKey,
  decimals = 6,
): Promise<PublicKey> {
  return await createMint(
    provider.connection,
    provider.wallet as any,
    mintAuthority,
    null, // No freeze authority
    decimals,
  )
}
