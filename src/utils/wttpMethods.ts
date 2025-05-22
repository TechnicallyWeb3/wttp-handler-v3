/**
 * WTTP Methods Utility Module
 * 
 * This module provides utility functions for interacting with the Web3 HTTP (WTTP) protocol.
 * WTTP is a decentralized protocol that allows accessing web content stored on blockchain networks.
 * 
 * The module includes functions for:
 * - Parsing and validating WTTP URLs
 * - Resolving ENS names to Ethereum addresses
 * - Interacting with WTTP Gateway and Web3Site contracts
 * - Making HEAD and GET requests to WTTP resources
 */

// Import from the root directory for compatibility with the build process
import {  
    WttpGatewayFactory, 
    Web3SiteFactory,
    config
} from "../../wttp.config";
import { ethers } from "ethers";

import { 
    HEADRequestStruct, 
    HEADResponseStruct, 
    Web3Site 
} from "../interfaces/contracts/Web3Site";
import { 
    GETRequestStruct, 
    GETResponseStruct, 
    WTTPGatewayV3 
} from "../interfaces/contracts/WTTPGatewayV3";
import { 
    WttpProvider, 
    WttpUrl, 
    GETOptions, 
    HEADOptions, 
    WttpNetworkConfig 
} from "../interfaces/WTTPTypes";
import { Web3Site__factory } from "../interfaces/contracts/Web3Site__factory";
import { WTTPGatewayV3__factory } from "../interfaces/contracts/WTTPGatewayV3__factory";

/**
 * The current version of the WTTP protocol supported by this library
 */
export const WTTP_VERSION = "WTTP/3.0";

/**
 * Formats and validates an Ethereum address
 * 
 * @param address - The Ethereum address to format and validate
 * @returns The checksummed Ethereum address
 * @throws Error if the address is invalid
 */
export function formatEthereumAddress(address: string | ethers.Addressable): string {
    try {
        // Use ethers to validate the host is a valid address
        const checksumAddress = ethers.getAddress(String(address));
        // ethers.isAddress(checksumAddress); // try/catch implemented, so this is not needed
        return checksumAddress;
    } catch (error) {
        throw `Invalid Ethereum address: ${address} - ${error}`;
    }
}

/**
 * Resolves an ENS (Ethereum Name Service) name to its corresponding Ethereum address
 * 
 * @param name - The ENS name to resolve (e.g., "example.eth")
 * @returns Promise resolving to the Ethereum address
 * @throws Error if the ENS name cannot be resolved
 */
export async function resolveEnsName(name: string): Promise<string> {
    const rpcUrl = config.networks.mainnet.rpcList[0];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    try {
        const resolved = await provider.resolveName(name);
        if (resolved) {
            return resolved;
        } else {
            throw `Could not resolve ENS name: ${name}`;
        }
    } catch (error) {
        throw `Invalid ENS name: ${name} - ${error}`;
    }
}

/**
 * Parses and validates a WTTP URL, resolving host names and determining network information
 * 
 * @param url - The WTTP URL to parse
 * @returns Promise resolving to a WttpUrl object containing parsed URL information
 * @throws Error if the URL is invalid or cannot be parsed
 */
export async function getWttpUrl(url: URL | string): Promise<WttpUrl> {
    url = new URL(url);
    if (!url.protocol.startsWith('wttp')) {
        // console.log(`Protocol not supported: ${url.protocol}`);
        throw `Invalid WTTP URL: ${url.protocol} - URL must start with wttp://`;
    }

    // Use port to determine network, or default to first network in config
    const networkName = url.port || String(config.networks[Object.keys(config.networks)[0]].chainId);
    const network = getNetworkAlias(networkName);
    url.port = networkName;

    try {
        // Resolve host address (ENS or Ethereum address)
        const hostAddress = await getHostAddress(url);
        url.host = hostAddress;
        // Get gateway address for the network
        const gatewayAddress = getGatewayAddress(url);
        return {
            url,
            network,
            gateway: gatewayAddress,
            host: hostAddress
        }
    } catch (error) {
        throw `Bad Host or Gateway: ${url} - ${error}`;
    }
}

/**
 * Maps network aliases to their canonical network names
 * 
 * @param alias - The network alias or chain ID
 * @returns The canonical network name
 */
export function getNetworkAlias(alias: string): string {
    const aliases: Record<string, string> = {
        "leth": "localhost",
        "local": "localhost",
        "31337": "localhost",
        "seth": "sepolia",
        "11155111": "sepolia",
        "eth": "mainnet",
        "1": "mainnet",
    }
    return aliases[alias] || alias;
}

/**
 * Resolves a hostname to an Ethereum address
 * Handles both ENS names and direct Ethereum addresses
 * 
 * @param url - The URL containing the hostname to resolve
 * @returns Promise resolving to the Ethereum address
 */
export async function getHostAddress(url: string | URL): Promise<string> {
    url = new URL(url);
    const host = url.hostname;
    if (host.endsWith('.eth')) {
        return await resolveEnsName(host);
    }
    return formatEthereumAddress(host);
}

/**
 * Gets the WTTP gateway address for a given network
 * 
 * @param url - The URL containing network information in the port
 * @returns The Ethereum address of the WTTP gateway for the network
 */
export function getGatewayAddress(url: URL | string): string {
    url = new URL(url);
    const networkAlias = getNetworkAlias(url.port);
    const networkKeys = Object.keys(config.networks);
    const network = networkAlias ? config.networks[networkAlias] : config.networks[networkKeys[0]];
    return formatEthereumAddress(network.gateway);
}

/**
 * Creates a WTTP provider for interacting with WTTP contracts
 * 
 * @param wttpUrl - The parsed WTTP URL information
 * @param signer - Optional Ethereum signer for authenticated requests
 * @returns Promise resolving to a WttpProvider object with gateway and host contracts
 * @throws Error if the provider cannot be created
 * 
 * Note: This function modifies the url in the return. When returning the response to the client, use the original url.
 */
export async function getWttpProvider(
    wttpUrl: WttpUrl, 
    signer?: ethers.Signer
): Promise<WttpProvider> {    
    let network: WttpNetworkConfig;
    let provider: ethers.JsonRpcProvider;
    try {
        // Get network configuration and create JSON-RPC provider
        network = config.networks[wttpUrl.network];
        provider = new ethers.JsonRpcProvider(network.rpcList[0], network.chainId);
    } catch (error) {
        throw `Invalid network ${wttpUrl.network} - could not mount provider: ${error}`;
    }

    try {
        // Load the Web3Site contract (host) and WTTP Gateway contract
        // Not technically needed for read-only operations, but good to have
        // Will be needed for write methods in the future
        const host = await loadWttpHost(wttpUrl.host, provider, signer);
        const gateway = await loadWttpGateway(wttpUrl, provider, signer);

        return { gateway, host };
    } catch (error) {
        throw `
            Invalid WTTP contracts: \n
            WTTP Gateway: ${wttpUrl.gateway}; \n
            Web3Site: ${wttpUrl.host}; - ${error}
        `;
    }
}

/**
 * A HEAD request that will fail if sent to an invalid path
 * Used for testing if a contract implements the WTTP protocol
 */
const failHeadRequest: HEADRequestStruct = {
    requestLine: {
        protocol: WTTP_VERSION,
        path: "404", // should return 404 since the path doesn't start with a /
        method: 0
    },
    ifModifiedSince: 0n,
    ifNoneMatch: ethers.ZeroHash,
}

/**
 * Loads a Web3Site contract instance and verifies it implements the WTTP protocol
 * 
 * @param address - The Ethereum address of the Web3Site contract
 * @param provider - The Ethereum JSON-RPC provider
 * @param signer - Optional Ethereum signer for authenticated requests
 * @returns Promise resolving to a Web3Site contract instance
 * @throws Error if the contract is invalid or doesn't implement the WTTP protocol
 */
export async function loadWttpHost(
    address: string | ethers.Addressable, 
    provider: ethers.JsonRpcProvider, 
    signer?: ethers.Signer
): Promise<Web3Site> {
    try {
        // Create a random wallet if no signer is provided
        signer = signer || ethers.Wallet.createRandom();
        let siteFactory = new Web3Site__factory(signer.connect(provider));
        let site = siteFactory.attach(address) as Web3Site;
        // Test if the contract implements the WTTP protocol
        await site.HEAD(failHeadRequest);
        return site;
    } catch(error) {
        throw `Invalid WTTP Host: ${address} - invalid contract: ${error}`;
        // should throw a 501 Not Implemented error upstream
    }
}

/**
 * Checks if a Web3Site contract implements the WTTP protocol
 * 
 * @param host - The Web3Site contract instance to check
 * @returns Promise resolving to true if the contract is valid, false otherwise
 */
export async function checkWttpHost(host: Web3Site): Promise<boolean> {
    try {
        // A successful call means the host is valid
        await host.HEAD(failHeadRequest);
        return true;
    } catch(error) {
        return false;
        // should throw a 501 Not Implemented error upstream
    }
}

/**
 * Loads a WTTP Gateway contract instance and verifies it implements the WTTP protocol
 * 
 * @param wttpUrl - The parsed WTTP URL information
 * @param provider - The Ethereum JSON-RPC provider
 * @param signer - Optional Ethereum signer for authenticated requests
 * @returns Promise resolving to a WTTPGatewayV3 contract instance
 * @throws Error if the contract is invalid or doesn't implement the WTTP protocol
 */
export async function loadWttpGateway(wttpUrl: WttpUrl, provider: ethers.JsonRpcProvider, signer?: ethers.Signer): Promise<WTTPGatewayV3> {
    try {
        // Create a random wallet if no signer is provided
        signer = signer || ethers.Wallet.createRandom();
        let gatewayFactory = new WTTPGatewayV3__factory(signer.connect(provider));
        let gateway = gatewayFactory.attach(wttpUrl.gateway) as WTTPGatewayV3;
        // Test if the contract implements the WTTP protocol
        await gateway.HEAD(wttpUrl.host, failHeadRequest);
        return gateway;
    } catch(error) {
        throw `Invalid WTTP Gateway: ${wttpUrl.gateway} - invalid contract: ${error}`;
        // should throw a 502 Bad Gateway error upstream
    }
}

/**
 * Checks if a WTTP Gateway contract implements the WTTP protocol
 * 
 * @param gateway - The WTTPGatewayV3 contract instance to check
 * @param host - The Ethereum address of the Web3Site contract
 * @returns Promise resolving to true if the contract is valid, false otherwise
 */
export async function checkWttpGateway(gateway: WTTPGatewayV3, host: string | ethers.Addressable): Promise<boolean> {
    try {
        // A successful call means the gateway is valid
        await gateway.HEAD(host, failHeadRequest);
        return true;
    } catch(error) {
        return false;
        // should throw a 502 Bad Gateway error upstream
    }
}

/**
 * Performs a GET request to a WTTP resource
 * 
 * @param url - The WTTP URL to request
 * @param options - Optional parameters for the GET request
 * @returns Promise resolving to a GETResponseStruct containing the response data
 */
export async function wttpGet(url: URL | string, options?: GETOptions): Promise<GETResponseStruct> {
    url = new URL(url);
    
    // Parse the URL and create a provider
    let wttpUrl: WttpUrl = await getWttpUrl(url);
    let wttpProvider: WttpProvider = await getWttpProvider(wttpUrl, options?.signer);

    // Create the GET request structure
    const getReq: GETRequestStruct = {
        head: {
            requestLine: {
                protocol: WTTP_VERSION,
                path: url.pathname,
                method: 1 // GET bitmask
            },
            ifModifiedSince: options?.ifModifiedSince || 0n,
            ifNoneMatch: options?.ifNoneMatch || ethers.ZeroHash,
        },
        rangeBytes: options?.range || { start: 0, end: 0 },
    }
    try {
        // Send the GET request through the gateway
        const response = await wttpProvider.gateway.GET(wttpUrl.host, getReq);
        return response;
    } catch(error) {
        // Handle errors with appropriate HTTP status codes
        let statusCode: bigint = 500n; // Internal Server Error by default
        if (wttpProvider.gateway && !checkWttpGateway(wttpProvider.gateway, wttpUrl.host)) {
            statusCode = 502n; // Bad Gateway
            if (wttpProvider.host && !checkWttpHost(wttpProvider.host)) {
                statusCode = 501n; // Not Implemented
            }
        }

        // Return an empty response with the appropriate error status code
        return wttpErrorResponse(statusCode);
    }
}

/**
 * Creates an error response for WTTP requests
 * 
 * @param statusCode - The HTTP status code for the error
 * @param wttpUrl - Optional WTTP URL information to include in the error message
 * @returns A GETResponseStruct with the error information
 */
export function wttpErrorResponse(statusCode: bigint, wttpUrl?: WttpUrl): GETResponseStruct {
    return {
        head: {
            responseLine: {
                protocol: WTTP_VERSION,
                code: statusCode
            },
            headerInfo: {
                methods: 0n,
                cache: { 
                    maxAge: 0n, 
                    noStore: false, 
                    noCache: false, 
                    immutableFlag: false, 
                    publicFlag: false 
                },
                redirect: { code: 0n, location: '' },
                resourceAdmin: ethers.ZeroAddress
            },
            metadata: {
                mimeType: '',
                charset: '',
                encoding: '',
                language: '',
                size: 0n,
                version: 0n,
                lastModified: 0n,
                header: ethers.ZeroHash
            },
            etag: ethers.ZeroHash
        },
        bytesRange: { start:0, end:0 },
        data: wttpUrl ? `Gateway: ${wttpUrl.gateway} - Host: ${wttpUrl.host}` : ''
    }
}

/**
 * Performs a HEAD request to a WTTP resource
 * 
 * @param url - The WTTP URL to request
 * @param options - Optional parameters for the HEAD request
 * @returns Promise resolving to a HEADResponseStruct containing the response metadata
 * @throws Error if the URL is invalid or the provider cannot be created
 */
export async function wttpHead(url: URL | string, options?: HEADOptions): Promise<HEADResponseStruct> {
    url = new URL(url);

    // Parse the URL
    let wttpUrl: WttpUrl;
    try {
        wttpUrl = await getWttpUrl(url);
    } catch(error) {
        throw `Invalid WTTP URL: ${error}`;
    }

    // Create a provider
    let wttpProvider: WttpProvider;
    try {
        wttpProvider = await getWttpProvider(wttpUrl, options?.signer);
    } catch(error) {
        throw `Failed to mount WTTP Provider: ${error}`;
    }
    
    // Create the HEAD request structure
    const headReq: HEADRequestStruct = {
        requestLine: {
            protocol: WTTP_VERSION,
            path: url.pathname,
            method: 0
        },
        ifModifiedSince: options?.ifModifiedSince || 0n,
        ifNoneMatch: options?.ifNoneMatch || ethers.ZeroHash,
    }

    try {
        // Send the HEAD request through the gateway
        const response = await wttpProvider.gateway.HEAD(wttpUrl.host, headReq);
        return response;
    } catch(error) {
        // Handle errors with appropriate HTTP status codes
        let statusCode: bigint = 500n; // Internal Server Error by default
        if (wttpProvider.gateway && !checkWttpGateway(wttpProvider.gateway, wttpUrl.host)) {
            statusCode = 502n; // Bad Gateway
            if (wttpProvider.host && !checkWttpHost(wttpProvider.host)) {
                statusCode = 501n; // Not Implemented
            }
        }

        // Return an empty response with the appropriate error status code
        return wttpErrorResponse(statusCode, wttpUrl).head;
    }
}
