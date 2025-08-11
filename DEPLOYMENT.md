# SDM Mint Controller Deployment Guide

This guide explains how to deploy the SDM (Solana Decentralized Mint) Controller to Devnet.

## Fixed Security Issues

### ✅ Critical Security Vulnerability Fixed
- **Issue**: Signature verification logic was insecure - only checked for presence of ed25519 instructions without validating signatures or message content
- **Fix**: Implemented proper signature verification that:
  - Validates ed25519 instruction format using correct offset-based parsing
  - Verifies the signed message matches expected mint parameters
  - Prevents duplicate signatures from same signer
  - Ensures signatures were actually validated by the Solana runtime

### ✅ Critical Ed25519 Parsing Vulnerability Fixed (Post-Deploy)
- **Issue**: The ed25519 instruction parsing assumed a fixed data layout instead of using proper offsets from the instruction header
- **Risk**: Could allow specially crafted instructions to bypass signature verification
- **Fix**: Corrected implementation to properly read offset values and use them to locate public key, signature, and message data

### ✅ Deployment Script Issues Fixed
- **Issue**: Oracle keys were generated dynamically on each run
- **Fix**: Implemented persistent oracle key management with file-based storage
- **Issue**: Unsafe type casting of provider wallet
- **Fix**: Proper type checking and error handling for wallet access
- **Issue**: Keypair loading could silently overwrite existing keys on file corruption
- **Fix**: Improved error handling to fail fast and alert users to corrupted keypair files

### ✅ Build Artifacts Removed
- **Issue**: target/ directory was committed to git
- **Fix**: Added comprehensive .gitignore and removed build artifacts from git tracking

## Prerequisites

1. **Solana CLI installed and configured**
   ```bash
   solana config set --url devnet
   solana config set --keypair ~/.config/solana/id.json
   ```

2. **Ensure you have SOL on Devnet**
   ```bash
   solana airdrop 2
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

## Deployment Steps

### 1. Configure for Devnet
The project is already configured for Devnet deployment in `Anchor.toml`:
```toml
[provider]
cluster = "Devnet"
```

### 2. Deploy the Program
```bash
# Build and deploy the program
anchor build
anchor deploy --provider.cluster devnet

# Or use the package script
npm run deploy-devnet
```

### 3. Run the Deployment Script
```bash
# Run the comprehensive deployment script
anchor run deploy
```

This script will:
- Create persistent oracle keypairs (saved to `keypairs/` directory)
- Create the SDM token mint with 9 decimal places
- Initialize the mint controller with multi-signature requirements
- Mint the initial supply to a treasury account
- Verify the deployment was successful

## Important Security Notes

### Oracle Key Management
- Oracle keys are saved to `keypairs/oracle1.json` and `keypairs/oracle2.json`
- **These files are critical** - back them up securely
- **Never commit these files to git** (they're gitignored)
- These keys are required for future minting operations

### Multi-signature Requirements
- Quorum: 2 signatures required for minting
- Only authorized oracle signers can sign mint transactions
- Nonce-based replay attack prevention
- Supply cap enforcement (5B SDM tokens maximum)

## Token Details

- **Name**: SDM Token
- **Decimals**: 9 (updated from 6)
- **Max Supply**: 5,000,000,000 SDM (5 billion)
- **Initial Mint**: 4,000,000,000 SDM (4 billion)
- **Remaining**: 1,000,000,000 SDM available for future minting

## Verification

After deployment, verify the setup:

```bash
# Check program deployment
solana program show <PROGRAM_ID> --url devnet

# Check mint information
spl-token display <MINT_ADDRESS> --url devnet

# Check config account (requires custom RPC call)
```

## Usage After Deployment

### Minting Additional Tokens
To mint additional tokens, oracle signers must:

1. Create a message with mint parameters
2. Sign the message with their oracle private keys
3. Submit ed25519 signature verification instructions
4. Call the `mint_with_multisig` function

### Administrative Functions
- Update oracle signers (requires admin signature)
- Update admin (requires current admin signature)
- Update quorum requirements

## Troubleshooting

### Common Issues
1. **Insufficient SOL**: Ensure your wallet has enough SOL for transaction fees
2. **Program not deployed**: Run `anchor deploy` first
3. **Oracle keys not found**: Check that `keypairs/` directory exists and contains the keys
4. **Transaction failures**: Check Solana logs for detailed error messages

### Error Messages
- `QuorumNotReached`: Not enough oracle signatures
- `InvalidMessage`: Signature doesn't match expected message format
- `InvalidNonce`: Nonce must be greater than the last used nonce
- `ExceedsMaxSupply`: Requested mint would exceed maximum supply

## Next Steps

1. **Test the deployment** with small transactions
2. **Set up monitoring** for the mint controller
3. **Implement client applications** using the deployed contract
4. **Consider mainnet deployment** after thorough testing

## Contact

For issues or questions regarding the deployment, please refer to the code review comments or contact the development team.