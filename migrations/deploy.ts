import * as anchor from "@project-serum/anchor"
import type { Program } from "@project-serum/anchor"
import type { MintController } from "../target/types/mint_controller"
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, createMint, createAccount, getAssociatedTokenAddress, createAssociatedTokenAccount } from "@solana/spl-token"
import * as fs from "fs"
import * as path from "path"

// Configuration
const ORACLE_KEYS_DIR = path.join(__dirname, "../keypairs")
const ORACLE_1_PATH = path.join(ORACLE_KEYS_DIR, "oracle1.json")
const ORACLE_2_PATH = path.join(ORACLE_KEYS_DIR, "oracle2.json")
const MINT_DECIMALS = 9
const QUORUM = 2

// Ensure keypairs directory exists
if (!fs.existsSync(ORACLE_KEYS_DIR)) {
  fs.mkdirSync(ORACLE_KEYS_DIR, { recursive: true })
}

function loadOrCreateKeypair(filePath: string, name: string): Keypair {
  if (fs.existsSync(filePath)) {
    try {
      const secretKey = JSON.parse(fs.readFileSync(filePath, "utf8"))
      console.log(`Loaded existing ${name} from ${filePath}`)
      return Keypair.fromSecretKey(new Uint8Array(secretKey))
    } catch (error) {
      console.error(`Error: Failed to load or parse keypair from ${filePath}. Please check the file content or remove it to generate a new one.`, error)
      throw error;
    }
  }
  
  const keypair = Keypair.generate()
  fs.writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)))
  console.log(`Generated new ${name} and saved to ${filePath}`)
  console.log(`${name} public key:`, keypair.publicKey.toString())
  return keypair
}

async function main() {
  // Configure the client to use the specified cluster
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.MintController as Program<MintController>

  console.log("Program ID:", program.programId.toString())
  console.log("Wallet:", provider.wallet.publicKey.toString())
  console.log("Cluster:", provider.connection.rpcEndpoint)

  // Load admin keypair safely from provider
  const wallet = provider.wallet as anchor.Wallet
  if (!wallet.payer) {
    throw new Error("Wallet payer not found. Make sure your wallet is properly configured.")
  }
  const admin = wallet.payer

  // Load or create persistent oracle keys
  const oracle1 = loadOrCreateKeypair(ORACLE_1_PATH, "Oracle 1")
  const oracle2 = loadOrCreateKeypair(ORACLE_2_PATH, "Oracle 2")
  const oracleSigners = [oracle1.publicKey, oracle2.publicKey]

  console.log("\n=== Deployment Configuration ===")
  console.log("Admin:", admin.publicKey.toString())
  console.log("Oracle 1:", oracle1.publicKey.toString())
  console.log("Oracle 2:", oracle2.publicKey.toString())
  console.log("Quorum:", QUORUM)
  console.log("Token Decimals:", MINT_DECIMALS)

  // Create SDM token mint
  console.log("\n=== Creating SDM Token Mint ===")
  const mint = Keypair.generate()
  
  // Derive the PDA that will be the mint authority
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), Buffer.from("sdm_mint_ctrl")],
    program.programId
  )

  console.log("Mint address:", mint.publicKey.toString())
  console.log("Config PDA:", configPda.toString())

  // Create the mint with PDA as authority
  const mintAddress = await createMint(
    program.provider.connection,
    admin,
    configPda, // mint authority
    null, // freeze authority (none)
    MINT_DECIMALS,
    mint
  )

  console.log("Mint created at:", mintAddress.toString())

  // Initialize the mint controller
  console.log("\n=== Initializing Mint Controller ===")
  try {
    const tx = await program.methods
      .initialize(admin.publicKey, QUORUM, oracleSigners)
      .accounts({
        config: configPda,
        mint: mint.publicKey,
        mintAuthority: configPda,
        payer: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin, mint])
      .rpc()

    console.log("Initialize transaction signature:", tx)
  } catch (error) {
    console.error("Error initializing mint controller:", error)
    throw error
  }

  // Create treasury account for initial mint
  console.log("\n=== Creating Treasury Account ===")
  const treasuryTokenAccount = await getAssociatedTokenAddress(
    mint.publicKey,
    admin.publicKey
  )

  try {
    await createAssociatedTokenAccount(
      program.provider.connection,
      admin,
      mint.publicKey,
      admin.publicKey
    )
    console.log("Treasury token account:", treasuryTokenAccount.toString())
  } catch (error) {
    console.log("Treasury account might already exist:", error.message)
  }

  // Mint initial supply
  console.log("\n=== Minting Initial Supply ===")
  try {
    const tx = await program.methods
      .mintInitialSupply()
      .accounts({
        config: configPda,
        mint: mint.publicKey,
        treasury: treasuryTokenAccount,
        mintAuthority: configPda,
        admin: admin.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin])
      .rpc()

    console.log("Initial mint transaction signature:", tx)
  } catch (error) {
    console.error("Error minting initial supply:", error)
    throw error
  }

  // Verify deployment
  console.log("\n=== Verifying Deployment ===")
  const configAccount = await program.account.config.fetch(configPda)
  console.log("Config account:")
  console.log("  Admin:", configAccount.admin.toString())
  console.log("  Mint:", configAccount.mint.toString())
  console.log("  Quorum:", configAccount.quorum)
  console.log("  Total Minted:", configAccount.totalMinted.toString())
  console.log("  Oracle Signers:", configAccount.oracleSigners.map(pk => pk.toString()))

  // Get mint info
  const mintInfo = await program.provider.connection.getParsedAccountInfo(mint.publicKey)
  if (mintInfo.value?.data && 'parsed' in mintInfo.value.data) {
    const mintData = mintInfo.value.data.parsed.info
    console.log("Mint info:")
    console.log("  Decimals:", mintData.decimals)
    console.log("  Supply:", mintData.supply)
    console.log("  Mint Authority:", mintData.mintAuthority)
  }

  console.log("\n=== Deployment Summary ===")
  console.log("✅ SDM Mint Controller deployed successfully!")
  console.log("Program ID:", program.programId.toString())
  console.log("Mint Address:", mint.publicKey.toString())
  console.log("Config PDA:", configPda.toString())
  console.log("Treasury Account:", treasuryTokenAccount.toString())
  console.log("\n⚠️  IMPORTANT: Save these oracle keypairs securely:")
  console.log("Oracle 1 file:", ORACLE_1_PATH)
  console.log("Oracle 2 file:", ORACLE_2_PATH)
  console.log("\nThese keys are required for future minting operations!")
}

main().catch((error) => {
  console.error("Deployment failed:", error)
  process.exit(1)
})
