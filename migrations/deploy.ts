import * as anchor from "@project-serum/anchor"
import type { Program } from "@project-serum/anchor"
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, createMint } from "@solana/spl-token"
import type { MintController } from "../target/types/mint_controller"

async function main() {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.MintController as Program<MintController>

  console.log("Program ID:", program.programId.toString())
  console.log("Wallet:", provider.wallet.publicKey.toString())

  const admin = (provider.wallet as any).payer as Keypair

  // Example oracle signers (placeholder; replace with real oracles before mainnet)
  const oracle1 = Keypair.generate()
  const oracle2 = Keypair.generate()

  // Derive PDAs
  const [configPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), Buffer.from("sdm_mint_ctrl")],
    program.programId,
  )

  // Create the mint with 9 decimals and PDA as mint authority
  const mint = await createMint(
    provider.connection,
    admin,
    configPDA,
    null,
    9,
  )

  // Create admin treasury ATA to receive initial supply
  const adminAta = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    admin,
    mint,
    provider.wallet.publicKey,
  )

  // Initialize the controller
  await program.methods
    .initialize(provider.wallet.publicKey, 2, [oracle1.publicKey, oracle2.publicKey])
    .accounts({
      config: configPDA,
      mint,
      mintAuthority: configPDA,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  // Mint initial supply to admin treasury
  await program.methods
    .mintInitialSupply()
    .accounts({
      config: configPDA,
      mint,
      mintAuthority: configPDA,
      treasury: adminAta.address,
      admin: provider.wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc()

  console.log("Mint:", mint.toBase58())
  console.log("Config PDA:", configPDA.toBase58())
  console.log("Admin ATA:", adminAta.address.toBase58())
  console.log("Oracle 1:", oracle1.publicKey.toBase58())
  console.log("Oracle 2:", oracle2.publicKey.toBase58())
  console.log("Deployment complete.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
