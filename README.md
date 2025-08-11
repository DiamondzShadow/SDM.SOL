# Solana SDM Token - Complete Anchor Project

A comprehensive Solana token with advanced mint controller functionality, multisig oracle validation, and CCIP integration.

## Features

- ✅ **Secure Multisig Minting**: Oracle-controlled token minting with configurable quorum
- ✅ **Supply Cap Enforcement**: Maximum supply of 5 billion tokens
- ✅ **Initial Mint**: 4 billion tokens minted to treasury on initialization
- ✅ **CCIP Integration**: Ready for Chainlink Cross-Chain Interoperability Protocol
- ✅ **Replay Attack Protection**: Nonce-based security
- ✅ **Event Emission**: Comprehensive logging for all mint operations
- ✅ **Admin Controls**: Update oracle signers and admin permissions

## Project Structure

\`\`\`
solana-sdm/
├── Anchor.toml
├── Cargo.toml
├── programs/
│   └── mint-controller/
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
├── tests/
│   └── mint-controller.ts
├── app/
│   ├── package.json
│   └── src/
│       ├── mint-controller.ts
│       └── types.ts
├── migrations/
│   └── deploy.ts
└── README.md
\`\`\`

## Quick Start

### Prerequisites

\`\`\`bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Install Anchor CLI
npm install -g @project-serum/anchor-cli

# Install Node dependencies
npm install
\`\`\`

### Build and Test

\`\`\`bash
# Build the program
anchor build

# Run tests
anchor test

# Generate program keypair
anchor keys list
\`\`\`

### Deploy

#### Devnet Deployment

\`\`\`bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Airdrop SOL for deployment
solana airdrop 2

# Deploy to devnet
anchor deploy --provider.cluster devnet
\`\`\`

#### Mainnet Deployment

\`\`\`bash
# Configure Solana CLI for mainnet
solana config set --url mainnet-beta

# Deploy to mainnet (ensure you have sufficient SOL)
anchor deploy --provider.cluster mainnet
\`\`\`

## Program Architecture

### Core Components

1. **Config Account**: Stores program configuration including admin, oracle signers, and quorum settings
2. **Mint Controller**: Manages token minting with multisig validation
3. **Oracle System**: Ed25519 signature verification for authorized minting
4. **CCIP Integration**: Hooks for cross-chain token bridging

### Key Functions

- \`initialize\`: Set up the mint controller with admin and oracle configuration
- \`mint_initial_supply\`: Mint the initial 4B token supply to treasury
- \`mint_with_multisig\`: Mint tokens with oracle signature validation
- \`ccip_mint\`: CCIP-authorized minting for cross-chain operations
- \`update_oracle_signers\`: Admin function to update oracle configuration

## Security Features

- **Multisig Validation**: Requires quorum of oracle signatures for minting
- **Supply Cap**: Hard limit of 5 billion tokens
- **Nonce Protection**: Prevents replay attacks
- **PDA Authority**: Program-derived addresses for secure mint authority
- **Admin Controls**: Restricted administrative functions

## CCIP Integration

The program includes hooks for Chainlink's Cross-Chain Interoperability Protocol:

1. **Token Pool Integration**: Ready for CCIP token pool registration
2. **Cross-Chain Minting**: Authorized minting from other chains
3. **Bridge Compatibility**: Standard interface for cross-chain bridges

### CCIP Setup Steps

1. Deploy the program and initialize with oracle configuration
2. Register with Chainlink Token Manager
3. Provide mint authority PDA address to CCIP
4. Configure cross-chain token pools
5. Test bridging functionality

## Client Usage

\`\`\`typescript
import { SDMMintController } from './app/src/mint-controller';

// Initialize controller
const controller = new SDMMintController(program, provider);

// Initialize the program
await controller.initialize(
    adminPublicKey,
    mintPublicKey,
    2, // Quorum
    [oracle1.publicKey, oracle2.publicKey]
);

// Mint initial supply
await controller.mintInitialSupply(
    mintPublicKey,
    treasuryTokenAccount,
    adminKeypair
);
\`\`\`

## Testing

The test suite covers:
- Program initialization
- Initial supply minting
- Multisig minting validation
- Oracle signature verification
- Error conditions and edge cases

Run tests with:
\`\`\`bash
anchor test
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
\`\`\`
