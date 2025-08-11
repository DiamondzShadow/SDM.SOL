# Solana SDM Token - Full-Stack Web3 Application

A comprehensive Solana token project with advanced mint controller functionality, multisig oracle validation, CCIP integration, and a modern Next.js web frontend for token management.

## Features

### Solana Program Features
- ✅ **Secure Multisig Minting**: Oracle-controlled token minting with configurable quorum
- ✅ **Supply Cap Enforcement**: Maximum supply of 5 billion tokens
- ✅ **Initial Mint**: 4 billion tokens minted to treasury on initialization
- ✅ **CCIP Integration**: Ready for Chainlink Cross-Chain Interoperability Protocol
- ✅ **Replay Attack Protection**: Nonce-based security
- ✅ **Event Emission**: Comprehensive logging for all mint operations
- ✅ **Admin Controls**: Update oracle signers and admin permissions

### Web Frontend Features
- ✅ **Modern React UI**: Built with Next.js 14 and React 19
- ✅ **Beautiful Design System**: Radix UI components with Tailwind CSS
- ✅ **Dark/Light Theme**: Next-themes integration
- ✅ **Responsive Design**: Mobile-first responsive layout
- ✅ **TypeScript Support**: Full type safety throughout
- ✅ **Component Library**: Comprehensive shadcn/ui component system

## Project Structure

\`\`\`
solana-sdm/
├── Anchor.toml                  # Anchor workspace configuration
├── Cargo.toml                   # Rust workspace configuration
├── package.json                 # Next.js app dependencies & scripts
├── pnpm-lock.yaml              # Package manager lock file
├── tsconfig.json               # TypeScript configuration
├── DEPLOYMENT.md               # Deployment guide and security fixes
├── programs/                   # Solana programs
│   └── mint-controller/
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs          # Main program logic
├── tests/                      # Anchor program tests
│   └── mint-controller.ts
├── app/                        # TypeScript client library
│   ├── package.json
│   └── src/
│       ├── mint-controller.ts  # Client SDK
│       └── types.ts            # Type definitions
├── migrations/                 # Deployment scripts
│   └── deploy.ts
└── README.md
\`\`\`

## Quick Start

### Prerequisites

#### Required Software
- **Node.js 18+**: Required for Next.js and frontend development
- **pnpm**: Package manager (faster than npm)
- **Rust**: For Solana program development
- **Solana CLI**: For blockchain interaction
- **Anchor CLI**: For Solana program framework

#### Installation Commands

\`\`\`bash
# Install Node.js (if not already installed)
# Download from https://nodejs.org/ or use a version manager

# Install pnpm globally
npm install -g pnpm

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Install Anchor CLI
npm install -g @project-serum/anchor-cli

# Install project dependencies
pnpm install
\`\`\`

### Build and Test

#### Solana Program Development

\`\`\`bash
# Build the Solana program
anchor build

# Run Anchor tests
anchor test

# Generate program keypair
anchor keys list
\`\`\`

#### Frontend Development

\`\`\`bash
# Start the Next.js development server
pnpm dev

# Build the frontend for production
pnpm build

# Start the production server
pnpm start

# Run linting
pnpm lint
\`\`\`

The frontend will be available at \`http://localhost:3000\` when running in development mode.

### Deploy

#### Solana Program Deployment

**Devnet Deployment**

\`\`\`bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Airdrop SOL for deployment
solana airdrop 2

# Deploy to devnet
anchor deploy --provider.cluster devnet
\`\`\`

**Mainnet Deployment**

\`\`\`bash
# Configure Solana CLI for mainnet
solana config set --url mainnet-beta

# Deploy to mainnet (ensure you have sufficient SOL)
anchor deploy --provider.cluster mainnet
\`\`\`

#### Frontend Deployment

The Next.js frontend can be deployed to any hosting platform that supports Node.js:

**Vercel (Recommended)**
\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel
\`\`\`

**Other Platforms**
- **Netlify**: Connect your Git repository for automatic deployments
- **Railway**: Deploy with \`railway deploy\`
- **DigitalOcean App Platform**: Connect your GitHub repository

Make sure to set the appropriate environment variables for your Solana network configuration.

## Architecture

### Tech Stack

**Frontend**
- **Next.js 14**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Beautiful component library
- **Lucide React**: Icon library

**Blockchain**
- **Solana**: High-performance blockchain
- **Anchor**: Solana development framework
- **Rust**: Systems programming language

**Development Tools**
- **pnpm**: Fast package manager
- **ESLint**: Code linting
- **PostCSS**: CSS processing

### Program Components

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

## Usage

### Frontend Development

Start the development server:
\`\`\`bash
pnpm dev
\`\`\`

Visit \`http://localhost:3000\` to access the web interface for:
- Token management dashboard
- Mint controller operations
- Oracle configuration
- CCIP integration tools

### Client Library Usage

The project includes a TypeScript client library in the \`app/\` directory:

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

### Building the Client Library

\`\`\`bash
cd app
pnpm build
\`\`\`

## Testing

### Anchor Program Tests

The test suite covers:
- Program initialization
- Initial supply minting
- Multisig minting validation
- Oracle signature verification
- Error conditions and edge cases

Run Anchor tests:
\`\`\`bash
anchor test
\`\`\`

### Client Library Tests

Test the TypeScript client library:
\`\`\`bash
cd app
pnpm test
\`\`\`

### Frontend Testing

Run frontend linting:
\`\`\`bash
pnpm lint
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
