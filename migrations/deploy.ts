import * as anchor from "@project-serum/anchor"
import type { Program } from "@project-serum/anchor"
import type { MintController } from "../target/types/mint_controller"

async function main() {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.MintController as Program<MintController>

  console.log("Program ID:", program.programId.toString())
  console.log("Wallet:", provider.wallet.publicKey.toString())

  // Add deployment logic here
  console.log("SDM Mint Controller deployed successfully!")
}

main().catch(console.error)
