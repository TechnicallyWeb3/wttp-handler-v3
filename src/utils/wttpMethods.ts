/**
 * @file wttpMethods.ts
 * @description Core implementation of WTTP (Web3 HTTP) protocol methods
 * This file contains the utility functions for interacting with WTTP contracts
 * and handling WTTP protocol requests and responses.
 */

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
 * Current version of the WTTP protocol implemented by this library
 */
export const WTTP_VERSION = "WTTP/3.0";

/**
 * Validates and formats an Ethereum address to its checksum format
 * 
 * @param address - The Ethereum address to format, can be a string or ethers.Addressable
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
 * Resolves an ENS name to its corresponding Ethereum address
 * 
 * @param name - The ENS name to resolve (e.g., "example.eth")
 * @returns Promise resolving to the Ethereum address associated with the ENS name
 * @throws Error if the ENS name cannot be resolved or is invalid
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
 * Parses and validates a WTTP URL, resolving network, host, and gateway information
 * 
 * @param url - The WTTP URL to parse, can be a string or URL object
 * @returns Promise resolving to a WttpUrl object containing the parsed URL information
 * @throws Error if the URL is invalid or cannot be processed
 */
export async function getWttpUrl(url: URL | string): Promise<WttpUrl> {
    url = new URL(url);
    if (!url.protocol.startsWith('wttp')) {
        // console.log(`Protocol not supported: ${url.protocol}`);
        throw `Invalid WTTP URL: ${url.protocol} - URL must start with wttp://`;
    }

    // Get network from port or use default network
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
 * @param alias - The network alias or chain ID to resolve
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
 * If the hostname is an ENS name, it will be resolved through ENS
 * If the hostname is an Ethereum address, it will be formatted to checksum format
 * 
 * @param url - The URL containing the hostname to resolve
 * @returns Promise resolving to the Ethereum address
 * @throws Error if the hostname cannot be resolved to a valid Ethereum address
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
 * Gets the WTTP Gateway contract address for the specified network
 * 
 * @param url - The URL containing the network information in the port
 * @returns The WTTP Gateway contract address for the network
 * @throws Error if the gateway address is invalid
 */
export function getGatewayAddress(url: URL | string): string {
    url = new URL(url);
    const networkAlias = getNetworkAlias(url.port);
    const networkKeys = Object.keys(config.networks);
    const network = networkAlias ? config.networks[networkAlias] : config.networks[networkKeys[0]];
    return formatEthereumAddress(network.gateway);
}

/**
 * Creates a WTTP provider with connected contract instances for the gateway and host
 * 
 * @remarks
 * This function modifies the URL in the return. When returning the response to the client,
 * use the original URL.
 * 
 * @param wttpUrl - The WTTP URL object containing network, gateway, and host information
 * @param signer - Optional signer to use for contract interactions
 * @returns Promise resolving to a WttpProvider with connected contract instances
 * @throws Error if the provider cannot be created or contracts cannot be loaded
 */

export async function getWttpProvider(
    wttpUrl: WttpUrl, 
    signer?: ethers.Signer
): Promise<WttpProvider> {    
    let network: WttpNetworkConfig;
    let provider: ethers.JsonRpcProvider;
    try {
        network = config.networks[wttpUrl.network];
        provider = new ethers.JsonRpcProvider(network.rpcList[0], network.chainId);
        // console.log(provider);
    } catch (error) {
        throw `Invalid network ${wttpUrl.network} - could not mount provider: ${error}`;
    }

    try {
        // Not technically needed, but good to have, in future needed for write methods
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
 * A HEAD request that is expected to fail, used for testing contract validity
 * The path doesn't start with a slash, which should return a 404 error
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
 * Loads and validates a Web3Site contract instance
 * 
 * @param address - The address of the Web3Site contract
 * @param provider - The JSON-RPC provider to use for contract interactions
 * @param signer - Optional signer to use for contract interactions
 * @returns Promise resolving to a connected Web3Site contract instance
 * @throws Error if the contract is invalid or cannot be loaded
 */

export async function loadWttpHost(
    address: string | ethers.Addressable, 
    provider: ethers.JsonRpcProvider, 
    signer?: ethers.Signer
): Promise<Web3Site> {
    try {
        signer = signer || ethers.Wallet.createRandom();
        let siteFactory = new Web3Site__factory(signer.connect(provider));
        let site = siteFactory.attach(address) as Web3Site;
        await site.HEAD(failHeadRequest);
        return site;
    } catch(error) {
        throw `Invalid WTTP Host: ${address} - invalid contract: ${error}`;
        // should throw a 501 Not Implemented error upstream
    }
}

/**
 * Checks if a Web3Site contract instance is valid and implements the required interface
 * 
 * @param host - The Web3Site contract instance to check
 * @returns Promise resolving to true if the contract is valid, false otherwise
 */
export async function checkWttpHost(host: Web3Site): Promise<boolean> {
    // const result = await host.HEAD(failHeadRequest);
    // console.log(result);
    try {
        await host.HEAD(failHeadRequest); // a successful call means the host is valid
        return true;
    } catch(error) {
        return false;
        // should throw a 501 Not Implemented error upstream
    }
}

/**
 * Loads and validates a WTTPGatewayV3 contract instance
 * 
 * @param wttpUrl - The WTTP URL object containing gateway and host information
 * @param provider - The JSON-RPC provider to use for contract interactions
 * @param signer - Optional signer to use for contract interactions
 * @returns Promise resolving to a WTTPGatewayV3 contract instance
 * @throws Error if the contract is invalid or cannot be loaded
 */
export async function loadWttpGateway(wttpUrl: WttpUrl, provider: ethers.JsonRpcProvider, signer?: ethers.Signer): Promise<WTTPGatewayV3> {
    try {
        signer = signer || ethers.Wallet.createRandom();
        let gatewayFactory = new WTTPGatewayV3__factory(signer.connect(provider));
        let gateway = gatewayFactory.attach(wttpUrl.gateway) as WTTPGatewayV3;
        await gateway.HEAD(wttpUrl.host, failHeadRequest);
        return gateway;
    } catch(error) {
        throw `Invalid WTTP Gateway: ${wttpUrl.gateway} - invalid contract: ${error}`;
        // should throw a 502 Bad Gateway error upstream
    }
}

/**
 * Checks if a WTTPGatewayV3 contract instance is valid and implements the required interface
 * 
 * @param gateway - The WTTPGatewayV3 contract instance to check
 * @param host - The address of the Web3Site contract to use for validation
 * @returns Promise resolving to true if the contract is valid, false otherwise
 */
export async function checkWttpGateway(gateway: WTTPGatewayV3, host: string | ethers.Addressable): Promise<boolean> {
    try {
        await gateway.HEAD(host, failHeadRequest); // a successful call means the gateway is valid
        return true;
    } catch(error) {
        return false;
        // should throw a 502 Bad Gateway error upstream
    }
}

/**
 * Performs a GET request to a WTTP URL
 * 
 * @param url - The WTTP URL to request
 * @param options - Optional parameters for the GET request
 * @returns Promise resolving to a GETResponseStruct containing the response data
 * @throws Error if the URL is invalid or cannot be processed
 */
export async function wttpGet(url: URL | string, options?: GETOptions): Promise<GETResponseStruct> {
    url = new URL(url);
    
    // Parse and validate the WTTP URL
    let wttpUrl: WttpUrl = await getWttpUrl(url);
    
    // Create a provider with connected contract instances
    let wttpProvider: WttpProvider = await getWttpProvider(wttpUrl, options?.signer);

    // Prepare the GET request
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
        // Execute the GET request
        const response = await wttpProvider.gateway.GET(wttpUrl.host, getReq);
        return response;
    } catch(error) {
        // Handle errors and determine appropriate status code
        let statusCode: bigint = 500n;
        if (wttpProvider.gateway && !checkWttpGateway(wttpProvider.gateway, wttpUrl.host)) {
            statusCode = 502n;
            if (wttpProvider.host && !checkWttpHost(wttpProvider.host)) {
                statusCode = 501n;
            }
        }

        // Return an empty 500, 501, or 502 error
        return wttpErrorResponse(statusCode);
    }
}

/**
 * Creates a WTTP error response with the specified status code
 * 
 * @param statusCode - The HTTP status code to return
 * @param wttpUrl - Optional WTTP URL object to include in the response
 * @returns A GETResponseStruct with the specified error status code
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
 * Performs a HEAD request to a WTTP URL
 * 
 * @param url - The WTTP URL to request
 * @param options - Optional parameters for the HEAD request
 * @returns Promise resolving to a HEADResponseStruct containing the response metadata
 * @throws Error if the URL is invalid or cannot be processed
 */
export async function wttpHead(url: URL | string, options?: HEADOptions): Promise<HEADResponseStruct> {
    url = new URL(url);

    // Parse and validate the WTTP URL
    let wttpUrl: WttpUrl;
    try {
        wttpUrl = await getWttpUrl(url);
    } catch(error) {
        throw `Invalid WTTP URL: ${error}`;
    }

    // Create a provider with connected contract instances
    let wttpProvider: WttpProvider;
    try {
        wttpProvider = await getWttpProvider(wttpUrl, options?.signer);
    } catch(error) {
        throw `Failed to mount WTTP Provider: ${error}`;
    }
    
    // Prepare the HEAD request
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
        // Execute the HEAD request
        const response = await wttpProvider.gateway.HEAD(wttpUrl.host, headReq);
        return response;
    } catch(error) {
        // Handle errors and determine appropriate status code
        let statusCode: bigint = 500n;
        if (wttpProvider.gateway && !checkWttpGateway(wttpProvider.gateway, wttpUrl.host)) {
            statusCode = 502n;
            if (wttpProvider.host && !checkWttpHost(wttpProvider.host)) {
                statusCode = 501n;
            }
        }

        // Return an empty 500, 501, or 502 error
        return wttpErrorResponse(statusCode, wttpUrl).head;
    }
}
