# WTTP Handler v3

A TypeScript implementation of the WTTP (Web3 HTTP) protocol for interacting with decentralized websites on the Ethereum blockchain.

## Overview

WTTP Handler v3 provides a fetch-compatible API for making HTTP-like requests to Web3 sites deployed on Ethereum. It allows developers to interact with decentralized websites using familiar HTTP methods like GET and HEAD.

## Installation

```bash
npm install wttp-handler-v3
```

## Configuration

The handler uses a configuration file ([`wttp.config.ts`](./wttp.config.ts)) to specify network details and gateway contract addresses. You can customize this configuration for your specific needs.

```typescript
// Example configuration
const config: WttpConfig = {
  networks: {
    mainnet: {
      rpcList: ["https://ethereum-rpc.publicnode.com"],
      chainId: 1,
      gateway: "0xa80ffe9f24B1aCFf8B57036C02DA8A0983159322",
    },
    // Add more networks as needed
  },
};
```

## Usage

### Basic Usage

```typescript
import { wttpGet, wttpHead } from 'wttp-handler-v3';

// Make a GET request to a WTTP URL
const response = await wttpGet('wttp://example.eth/index.html');

// Make a HEAD request to check metadata
const metadata = await wttpHead('wttp://example.eth/index.html');
```

### Using with Custom Options

```typescript
import { wttpGet, ethers } from 'wttp-handler-v3';

// Create a signer
const privateKey = '0x...'; // Your private key
const signer = new ethers.Wallet(privateKey);

// Make a GET request with custom options
const response = await wttpGet('wttp://example.eth/index.html', {
  signer,
  ifModifiedSince: BigInt(Date.now() / 1000 - 3600), // 1 hour ago
  ifNoneMatch: '0x...' // ETag value
});
```

## API Reference

### Core Functions

- `wttpGet(url, options?)`: Performs a GET request to a WTTP URL
- `wttpHead(url, options?)`: Performs a HEAD request to a WTTP URL
- `getWttpUrl(url)`: Parses and validates a WTTP URL
- `resolveEnsName(name)`: Resolves an ENS name to its Ethereum address
- `formatEthereumAddress(address)`: Formats an Ethereum address to a checksum address
- `getNetworkAlias(alias)`: Resolves a network alias to its canonical name
- `getHostAddress(hostname)`: Resolves a hostname to its Ethereum address
- `getGatewayAddress(url)`: Extracts the gateway address from a WTTP URL

### Types

- `WttpUrl`: Parsed WTTP URL with resolved components
- `WttpProvider`: Provider for WTTP contract interactions
- `GETOptions`: Options for GET requests
- `HEADOptions`: Options for HEAD requests
- `WttpConfig`: Configuration for WTTP networks
- `WttpHandlerConfig`: Configuration for the WTTP Handler

## Network Support

The handler supports multiple Ethereum networks:

- Mainnet
- Sepolia Testnet
- Local Development Network

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

AGPL-3.0