# 🚀 Vote System Deployment Guide

## Prerequisites

1. **Node.js** (v18+ recommended, v21.7.2 has warnings)
2. **MetaMask** wallet with Sepolia ETH
3. **Infura** account for RPC access

## Setup Instructions

### 1. Environment Configuration

Copy the environment template:
```bash
cp env.example .env
```

Edit `.env` file with your values:
```bash
# Get from https://infura.io/
INFURA_PROJECT_ID=your_infura_project_id_here

# Export from MetaMask (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 2. Get Testnet ETH

- Visit [Sepolia Faucet](https://sepoliafaucet.com/)
- Enter your wallet address
- Request 0.5 ETH (enough for deployment)

### 3. Deploy to Sepolia

```bash
# Install dependencies
npm install

# Deploy to Sepolia testnet
npx hardhat run deploy.js --network sepolia
```

### 4. Deploy to Local Network (Alternative)

```bash
# Start local Hardhat network
npx hardhat node

# In another terminal, deploy locally
npx hardhat run deploy.js --network localhost
```

## Deployment Output

Successful deployment will show:
```
🎉 DEPLOYMENT COMPLETE!
📋 Contract Addresses:
   ChainlinkIntegration: 0x...
   TransferableNFT:      0x...
   SoulboundNFT:         0x...
   VoteFactory:          0x...
   Test Vote:            0x...
```

## Troubleshooting

### Error: "Cannot read properties of undefined (reading 'address')"
- **Cause**: Missing environment variables
- **Solution**: Check your `.env` file has `INFURA_PROJECT_ID` and `PRIVATE_KEY`

### Error: "insufficient funds"
- **Cause**: Not enough Sepolia ETH
- **Solution**: Get more ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

### Warning: "Node.js v21.7.2 not supported"
- **Cause**: Hardhat compatibility issue
- **Solution**: Use Node.js v18 or v20 for best compatibility

### Error: "network does not exist"
- **Cause**: Network configuration issue
- **Solution**: Check `hardhat.config.js` network settings

## Network Information

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
- **Explorer**: https://sepolia.etherscan.io/
- **Faucet**: https://sepoliafaucet.com/

### Local Development
- **Chain ID**: 31337
- **RPC URL**: `http://127.0.0.1:8545`
- **Accounts**: Pre-funded test accounts

## Security Notes

⚠️ **NEVER commit your `.env` file to version control!**

- Keep your private key secure
- Use testnet for development
- Verify contract addresses before interacting
- Test thoroughly before mainnet deployment

## Next Steps

After deployment:
1. Save contract addresses
2. Test voting functionality
3. Verify contracts on Etherscan (optional)
4. Set up frontend integration 