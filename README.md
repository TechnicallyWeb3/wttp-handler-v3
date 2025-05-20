# WTTP Handler v3

A TypeScript library for interacting with the Web3 HTTP (WTTP) protocol, enabling decentralized web content access from blockchain networks.

## Overview

WTTP (Web3 HTTP) is a decentralized protocol that allows accessing web content stored on blockchain networks. This library provides a JavaScript/TypeScript interface for interacting with WTTP resources, similar to the standard Fetch API.

The WTTP Handler v3 library enables:

- Parsing and validating WTTP URLs (`wttp://` protocol)
- Resolving ENS names to Ethereum addresses
- Interacting with WTTP Gateway and Web3Site smart contracts
- Making HEAD and GET requests to WTTP resources
- Error handling with appropriate HTTP status codes

## Installation

```bash
npm install wttp-handler
```

## Usage

### Basic Example

```typescript
import { wttpGet, wttpHead } from 'wttp-handler';

// Make a GET request to a WTTP resource
async function fetchWttpResource() {
  try {
    // Fetch content from a WTTP URL
    const response = await wttpGet('wttp://0x1234...5678/index.html');
    console.log('Response:', response);
    console.log('Content:', response.data);
    console.log('Status:', response.head.responseLine.code);
  } catch (error) {
    console.error('Error fetching WTTP resource:', error);
  }
}

// Make a HEAD request to get metadata about a WTTP resource
async function checkWttpResource() {
  try {
    // Get metadata about a WTTP resource
    const headResponse = await wttpHead('wttp://example.eth/index.html');
    console.log('Metadata:', headResponse);
    console.log('MIME Type:', headResponse.metadata.mimeType);
    console.log('Last Modified:', new Date(Number(headResponse.metadata.lastModified) * 1000));
  } catch (error) {
    console.error('Error checking WTTP resource:', error);
  }
}
```

### Using ENS Names

```typescript
import { wttpGet } from 'wttp-handler';

// Fetch content from a site using ENS name
async function fetchFromEns() {
  try {
    const response = await wttpGet('wttp://example.eth/index.html');
    console.log('Content from ENS site:', response.data);
  } catch (error) {
    console.error('Error fetching from ENS site:', error);
  }
}
```

### Specifying Network

```typescript
import { wttpGet } from 'wttp-handler';

// Fetch from a specific network using port notation
async function fetchFromNetwork() {
  // Use sepolia testnet (port 11155111)
  const response = await wttpGet('wttp://0x1234...5678:11155111/index.html');
  
  // Alternative using network alias
  const response2 = await wttpGet('wttp://0x1234...5678:seth/index.html');
}
```

### Using with Authentication

```typescript
import { wttpGet, GETOptions } from 'wttp-handler';
import { ethers } from 'ethers';

async function fetchWithSigner() {
  // Create a signer (wallet)
  const privateKey = '0x...'; // Your private key
  const signer = new ethers.Wallet(privateKey);
  
  // Options with signer
  const options: GETOptions = {
    signer: signer,
    // Other options like ifModifiedSince, ifNoneMatch, range, etc.
  };
  
  const response = await wttpGet('wttp://0x1234...5678/private-content.html', options);
  console.log('Authenticated content:', response.data);
}
```

## API Reference

### Core Functions

#### `wttpGet(url: URL | string, options?: GETOptions): Promise<GETResponseStruct>`

Performs a GET request to a WTTP resource.

- **Parameters:**
  - `url`: The WTTP URL to request
  - `options`: Optional parameters for the GET request
    - `signer`: Ethereum signer for authenticated requests
    - `ifModifiedSince`: Timestamp for conditional requests
    - `ifNoneMatch`: ETag for conditional requests
    - `range`: Byte range for partial content requests

- **Returns:** Promise resolving to a response object containing:
  - `head`: Metadata about the response
  - `bytesRange`: The byte range of the returned content
  - `data`: The actual content data

#### `wttpHead(url: URL | string, options?: HEADOptions): Promise<HEADResponseStruct>`

Performs a HEAD request to a WTTP resource to retrieve metadata without content.

- **Parameters:**
  - `url`: The WTTP URL to request
  - `options`: Optional parameters for the HEAD request
    - `signer`: Ethereum signer for authenticated requests
    - `ifModifiedSince`: Timestamp for conditional requests
    - `ifNoneMatch`: ETag for conditional requests

- **Returns:** Promise resolving to a response object containing metadata about the resource

### Utility Functions

#### `getWttpUrl(url: URL | string): Promise<WttpUrl>`

Parses and validates a WTTP URL, resolving host names and determining network information.

#### `resolveEnsName(name: string): Promise<string>`

Resolves an ENS name to its corresponding Ethereum address.

#### `formatEthereumAddress(address: string | ethers.Addressable): string`

Formats and validates an Ethereum address.

#### `getNetworkAlias(alias: string): string`

Maps network aliases to their canonical network names.

## WTTP Protocol Overview

The WTTP protocol is a decentralized alternative to HTTP that uses blockchain smart contracts to serve web content. Key components include:

1. **Web3Site Contract**: Represents a website on the blockchain, implementing methods like HEAD, GET, PUT, etc.

2. **WTTP Gateway**: Acts as an intermediary between clients and Web3Site contracts, providing additional functionality and standardization.

3. **URL Format**: WTTP URLs follow the format `wttp://[ethereum-address-or-ens]:[network]/path`
   - The Ethereum address or ENS name identifies the Web3Site contract
   - The network (optional) specifies which blockchain network to use
   - The path identifies the resource within the Web3Site

4. **HTTP-like Methods**: The protocol implements familiar HTTP methods:
   - HEAD: Get metadata about a resource
   - GET: Retrieve a resource
   - PUT: Create or update a resource
   - DELETE: Remove a resource
   - And others like PATCH, OPTIONS, etc.

## Configuration

The library uses a configuration file (`wttp.config.ts`) to specify network information and gateway addresses:

```typescript
// Example configuration
export const config: WttpConfig = {
  networks: {
    localhost: {
      rpcList: ["http://localhost:8545"],
      chainId: 31337,
      gateway: "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570",
    },
    sepolia: {
      rpcList: [
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://1rpc.io/sepolia",
        // Additional RPC endpoints...
      ],
      chainId: 11155111,
      gateway: "0x8B57036c02DA8A0983159322A80FFe9F24b1aCFF",
    },
    mainnet: {
      rpcList: [
        "https://ethereum-rpc.publicnode.com",
        "https://eth.llamarpc.com",
        // Additional RPC endpoints...
      ],
      chainId: 1,
      gateway: "0xa80ffe9f24B1aCFf8B57036C02DA8A0983159322",
    }
  },
};
```

You can customize this configuration to add additional networks or update gateway addresses.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the AGPL-3.0 License - see the LICENSE file for details.

## Acknowledgments

- [Ethers.js](https://docs.ethers.org/) for Ethereum interactions
- [WTTP Protocol](https://github.com/TechnicallyWeb3/wttp-handler-v3) specification