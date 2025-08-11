import * as anchor from "@project-serum/anchor"
import type { Program } from "@project-serum/anchor"
import type { MintController } from "../target/types/mint_controller"
import { SDMMintController, createSDMToken } from "../app/src/mint-controller"
import { expect } from "chai"
import { describe, before, it } from "mocha"

describe("SDM Mint Controller", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.MintController as Program<MintController>
  let controller: SDMMintController
  let mint: anchor.web3.PublicKey
  let admin: anchor.web3.Keypair
  let oracle1: anchor.web3.Keypair
  let oracle2: anchor.web3.Keypair

  before(async () => {
    admin = anchor.web3.Keypair.generate()
    oracle1 = anchor.web3.Keypair.generate()
    oracle2 = anchor.web3.Keypair.generate()

    controller = new SDMMintController(program, provider)

    // Airdrop SOL for testing
    await provider.connection.confirmTransaction(await provider.connection.requestAirdrop(admin.publicKey, 1e9))
  })

  it("Initializes the mint controller", async () => {
    const [configPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config"), Buffer.from("sdm_mint_ctrl")],
      program.programId,
    )

    mint = await createSDMToken(provider, configPDA)

    await controller.initialize(
      admin.publicKey,
      mint,
      2, // Quorum of 2
      [oracle1.publicKey, oracle2.publicKey],
    )

    const config = await controller.getConfig()
    expect(config.admin.toString()).to.equal(admin.publicKey.toString())
    expect(config.quorum).to.equal(2)
    expect(config.totalMinted.toString()).to.equal("0")
  })

  // Add more tests for minting, CCIP integration, etc.
})
