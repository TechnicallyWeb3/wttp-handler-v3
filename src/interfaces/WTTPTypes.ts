/**
 * @file WTTPTypes.ts
 * @description Type definitions for the WTTP protocol implementation
 * This file contains the type definitions used throughout the WTTP handler
 */

import { ethers } from "ethers";

import { Web3Site } from "./contracts/Web3Site";
import { RangeStruct, WTTPGatewayV3 } from "./contracts/WTTPGatewayV3";

/**
 * Configuration for a WTTP network
 */
export type WttpNetworkConfig = {
    /** List of RPC endpoints for the network */
    rpcList: string[];
    
    /** Chain ID of the network */
    chainId: number;
    
    /** Address of the WTTP Gateway contract on this network */
    gateway: string | ethers.Addressable;
};

/**
 * Configuration for all WTTP networks
 */
export type WttpConfig = {
    /** Map of network names to their configurations */
    networks: {
        [key: string]: WttpNetworkConfig;
    };
};

/**
 * Configuration for the WTTP Handler
 */
export type WttpHandlerConfig = {
    /** WTTP network configuration */
    wttpConfig: WttpConfig;
    
    /** Whether to use a static signer for all requests */
    staticSigner?: boolean;
    
    /** Signer to use for contract interactions */
    signer?: ethers.Signer;
};

/**
 * Parsed WTTP URL with resolved components
 */
export type WttpUrl = {
    /** The original URL object */
    url: URL;
    
    /** The resolved network name */
    network: string;
    
    /** The resolved gateway contract address */
    gateway: string;
    
    /** The resolved host contract address */
    host: string;
};

/**
 * Provider for WTTP contract interactions
 */
export type WttpProvider = {
    /** The WTTP Gateway contract instance */
    gateway: WTTPGatewayV3;
    
    /** The Web3Site contract instance (optional) */
    host?: Web3Site;
};

/**
 * Options for HEAD requests
 */
export type HEADOptions = {
    /** Timestamp for conditional requests (If-Modified-Since) */
    ifModifiedSince?: bigint;
    
    /** ETag for conditional requests (If-None-Match) */
    ifNoneMatch?: string;
    
    /** Signer to use for the request */
    signer?: ethers.Signer;
};

/**
 * Options for GET requests, extends HEAD options
 */
export type GETOptions = HEADOptions & {
    /** Byte range for partial content requests */
    range?: RangeStruct;
};