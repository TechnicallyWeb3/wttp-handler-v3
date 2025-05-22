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
import { ethers } from "ethers";
import { HEADResponseStruct, Web3Site } from "../interfaces/contracts/Web3Site";
import { GETResponseStruct, WTTPGatewayV3 } from "../interfaces/contracts/WTTPGatewayV3";
import { WttpProvider, WttpUrl, GETOptions, HEADOptions } from "../interfaces/WTTPTypes";
/**
 * The current version of the WTTP protocol supported by this library
 */
export declare const WTTP_VERSION = "WTTP/3.0";
/**
 * Formats and validates an Ethereum address
 *
 * @param address - The Ethereum address to format and validate
 * @returns The checksummed Ethereum address
 * @throws Error if the address is invalid
 */
export declare function formatEthereumAddress(address: string | ethers.Addressable): string;
/**
 * Resolves an ENS (Ethereum Name Service) name to its corresponding Ethereum address
 *
 * @param name - The ENS name to resolve (e.g., "example.eth")
 * @returns Promise resolving to the Ethereum address
 * @throws Error if the ENS name cannot be resolved
 */
export declare function resolveEnsName(name: string): Promise<string>;
/**
 * Parses and validates a WTTP URL, resolving host names and determining network information
 *
 * @param url - The WTTP URL to parse
 * @returns Promise resolving to a WttpUrl object containing parsed URL information
 * @throws Error if the URL is invalid or cannot be parsed
 */
export declare function getWttpUrl(url: URL | string): Promise<WttpUrl>;
/**
 * Maps network aliases to their canonical network names
 *
 * @param alias - The network alias or chain ID
 * @returns The canonical network name
 */
export declare function getNetworkAlias(alias: string): string;
/**
 * Resolves a hostname to an Ethereum address
 * Handles both ENS names and direct Ethereum addresses
 *
 * @param url - The URL containing the hostname to resolve
 * @returns Promise resolving to the Ethereum address
 */
export declare function getHostAddress(url: string | URL): Promise<string>;
/**
 * Gets the WTTP gateway address for a given network
 *
 * @param url - The URL containing network information in the port
 * @returns The Ethereum address of the WTTP gateway for the network
 */
export declare function getGatewayAddress(url: URL | string): string;
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
export declare function getWttpProvider(wttpUrl: WttpUrl, signer?: ethers.Signer): Promise<WttpProvider>;
/**
 * Loads a Web3Site contract instance and verifies it implements the WTTP protocol
 *
 * @param address - The Ethereum address of the Web3Site contract
 * @param provider - The Ethereum JSON-RPC provider
 * @param signer - Optional Ethereum signer for authenticated requests
 * @returns Promise resolving to a Web3Site contract instance
 * @throws Error if the contract is invalid or doesn't implement the WTTP protocol
 */
export declare function loadWttpHost(address: string | ethers.Addressable, provider: ethers.JsonRpcProvider, signer?: ethers.Signer): Promise<Web3Site>;
/**
 * Checks if a Web3Site contract implements the WTTP protocol
 *
 * @param host - The Web3Site contract instance to check
 * @returns Promise resolving to true if the contract is valid, false otherwise
 */
export declare function checkWttpHost(host: Web3Site): Promise<boolean>;
/**
 * Loads a WTTP Gateway contract instance and verifies it implements the WTTP protocol
 *
 * @param wttpUrl - The parsed WTTP URL information
 * @param provider - The Ethereum JSON-RPC provider
 * @param signer - Optional Ethereum signer for authenticated requests
 * @returns Promise resolving to a WTTPGatewayV3 contract instance
 * @throws Error if the contract is invalid or doesn't implement the WTTP protocol
 */
export declare function loadWttpGateway(wttpUrl: WttpUrl, provider: ethers.JsonRpcProvider, signer?: ethers.Signer): Promise<WTTPGatewayV3>;
/**
 * Checks if a WTTP Gateway contract implements the WTTP protocol
 *
 * @param gateway - The WTTPGatewayV3 contract instance to check
 * @param host - The Ethereum address of the Web3Site contract
 * @returns Promise resolving to true if the contract is valid, false otherwise
 */
export declare function checkWttpGateway(gateway: WTTPGatewayV3, host: string | ethers.Addressable): Promise<boolean>;
/**
 * Performs a GET request to a WTTP resource
 *
 * @param url - The WTTP URL to request
 * @param options - Optional parameters for the GET request
 * @returns Promise resolving to a GETResponseStruct containing the response data
 */
export declare function wttpGet(url: URL | string, options?: GETOptions): Promise<GETResponseStruct>;
/**
 * Creates an error response for WTTP requests
 *
 * @param statusCode - The HTTP status code for the error
 * @param wttpUrl - Optional WTTP URL information to include in the error message
 * @returns A GETResponseStruct with the error information
 */
export declare function wttpErrorResponse(statusCode: bigint, wttpUrl?: WttpUrl): GETResponseStruct;
/**
 * Performs a HEAD request to a WTTP resource
 *
 * @param url - The WTTP URL to request
 * @param options - Optional parameters for the HEAD request
 * @returns Promise resolving to a HEADResponseStruct containing the response metadata
 * @throws Error if the URL is invalid or the provider cannot be created
 */
export declare function wttpHead(url: URL | string, options?: HEADOptions): Promise<HEADResponseStruct>;
