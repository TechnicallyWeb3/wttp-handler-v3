# WTTP Handler Testing Guide

This document provides instructions for testing the WTTP Handler library.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

## Running Tests

### Unit Tests

Unit tests can be run locally without requiring a blockchain connection:

```bash
npm test
```

To run tests in watch mode (tests will automatically re-run when files change):

```bash
npm run test:watch
```

### Integration Tests with Testnet

To run integration tests that interact with actual smart contracts on a testnet:

1. Set up your environment variables:
   ```bash
   export RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
   export PRIVATE_KEY="your_private_key_for_testing"
   ```

2. Run the integration tests:
   ```bash
   npm run test:integration
   ```

> Note: Integration tests require a connection to a testnet (e.g., Sepolia) and a wallet with some test ETH.

## Test Structure

- `test/unit/`: Contains unit tests that can run without blockchain connection
- `test/integration/`: Contains tests that require a blockchain connection

## Mocking Strategy

The test suite uses Sinon.js for mocking. Key components that are mocked:

1. **Ethers Provider**: Mocked to avoid actual RPC calls
2. **Contract Instances**: Mocked to return predefined responses
3. **Blockchain Responses**: Predefined response structures for HEAD and GET requests

## Adding New Tests

When adding new tests:

1. For unit tests, use the mocking utilities in `test/test-helpers.ts`
2. For integration tests, ensure you have the necessary testnet setup

## Testing on Different Networks

To test on different networks:

1. Update the RPC_URL environment variable to point to your desired network
2. Ensure your wallet has funds on that network
3. Deploy test contracts to that network if needed

## Troubleshooting

If you encounter issues:

1. Verify your RPC connection is working
2. Check that your wallet has sufficient funds for test transactions
3. Ensure the contract addresses in your tests match the deployed contracts
4. Verify that the contract ABIs match the deployed contract versions