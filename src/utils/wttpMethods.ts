import wttpConfig from "../../wttp.config";
import {  
    WttpGatewayAbi, 
    Web3SiteAbi 
} from "../../wttp.config";
import { ethers, JsonRpcApiProvider } from "ethers";

import { HEADRequestStruct, HEADResponseStruct, Web3Site } from "../interfaces/contracts/Web3Site";
import { GETRequestStruct, GETResponseStruct, WTTPGateway } from "../interfaces/contracts/WTTPGateway";
import { WttpConfig, WttpProvider, WttpUrl, GETOptions, HEADOptions, WttpNetworkConfig } from "../interfaces/WTTPTypes";

export const WTTP_VERSION = "WTTP/3.0";

export async function resolveEnsName(name: string, wttpConfig: WttpConfig): Promise<string> {
    const rpcUrl = wttpConfig.networks.ethereum.rpcList[0];
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

export async function formatEthereumAddress(address: string | ethers.Addressable): Promise<string> {
    try {
        // use ethers to validate the host is a valid address/domain
        const checksumAddress = ethers.getAddress(String(address));
        ethers.isAddress(checksumAddress);
        return checksumAddress;
    } catch (error) {
        throw `Invalid Ethereum address: ${address} - ${error}`;
    }
}

export async function getHostAddress(url: string | URL): Promise<string> {
    url = new URL(url);
    const host = url.hostname;
    if (host.endsWith('.eth')) {
        return await resolveEnsName(host, wttpConfig);
    }
    return await formatEthereumAddress(host);
}

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

// modifies the url in the return, when returning the response to the client, use the original url
export async function getWttpUrl(url: URL | string, signer: ethers.Signer): Promise<WttpUrl> {
    url = new URL(url);
    const address = await getHostAddress(url);
    // Create new URL with checksummed address as hostname while preserving other parts
    url = new URL(url.href.replace(url.hostname, address));
    let network: WttpNetworkConfig;

    try {
        if (url.port) {
            try {
                const networkName = getNetworkAlias(url.port);
                network = wttpConfig.networks[networkName];
            } catch (error) {
                throw `Network alias not found: ${url.port} - ${error}`;
            }
        } else {
            network = wttpConfig.networks[0];
        }
        if (network.rpcList.length === 0) {
            throw `No RPC URL for network: ${network.chainId}`;
        }
    } catch (error) {
        throw `Invalid network: ${error}`;
    }

    try {
        const provider = new ethers.JsonRpcProvider(network.rpcList[0], network.chainId);
        
        const site = new ethers.Contract(
            address, 
            Web3SiteAbi, 
            provider
        ).connect(signer || null) as Web3Site;

        const gateway = new ethers.Contract(
            network.gateway, 
            WttpGatewayAbi, 
            provider
        ).connect(signer || null) as WTTPGateway;

        return { url, gateway, site };
    } catch (error) {
        throw `
            Could not set WTTP contract: \n
            Network: ${network.chainId} - ${network.rpcList[0]}; \n 
            WTTP Gateway: ${network.gateway}; \n
            Web3Site: ${address}; - ${error}
        `;
    }
}

const failHeadRequest: HEADRequestStruct = {
    requestLine: {
        protocol: WTTP_VERSION,
        path: "404", // should return 404 since the path doesn't start with a /
        method: 0
    },
    ifModifiedSince: 0n,
    ifNoneMatch: ethers.ZeroHash,
}

export async function checkWttpHost(site: Web3Site): Promise<boolean> {
    try {
        const siteFailResponse = await site.HEAD(failHeadRequest);
        // if the HEAD request returns a 404, then the host is not a valid Web3Site contract
        const statusCode = siteFailResponse.responseLine.code;
        if (statusCode !== 404n) {
            throw `Site responded with ${statusCode} instead of 404`;
        }
    } catch(error) {
        throw `Invalid WTTP Host: ${site.target} - invalid contract: ${error}`;
    }
    return true;
}

export async function checkWttpGateway(gateway: WTTPGateway): Promise<boolean> {
    try {
        const wttpFailResponse = await gateway.HEAD(gateway.target, failHeadRequest);
        const statusCode = wttpFailResponse.responseLine.code;
        if (statusCode !== 404n) {
            throw `Gateway responded with ${statusCode} instead of 404`;
        }
    } catch(error) {
        throw `Invalid WTTP Gateway: ${gateway.target} - invalid contract: ${error}`;
    }
    return true;
}

export async function wttpGet(url: URL | string, options?: GETOptions): Promise<GETResponseStruct> {
    url = new URL(url);
    const wttpUrl = await getWttpUrl(url, options?.signer || ethers.Wallet.createRandom());

    try {
        if (!wttpUrl.site) {
            throw `Site is undefined: ${wttpUrl.url.hostname}`;
        }
        await checkWttpHost(wttpUrl.site);
    } catch(error) {
        throw `Invalid WTTP Host: ${error}`;
    }

    try {
        if (!wttpUrl.gateway) {
            throw `Gateway is undefined: ${wttpUrl.url.hostname}`;
        }
        await checkWttpGateway(wttpUrl.gateway);
    } catch(error) {
        throw `Invalid WTTP Gateway: ${error}`;
    }

    const getReq: GETRequestStruct = {
        head: {
            requestLine: {
                protocol: WTTP_VERSION,
                path: url.pathname,
                method: 0
            },
            ifModifiedSince: options?.ifModifiedSince || 0n,
            ifNoneMatch: options?.ifNoneMatch || ethers.ZeroHash,
        },
        rangeBytes: options?.range || { start: 0, end: 0 },
    }
    try {
        const response = await wttpUrl.gateway.GET(wttpUrl.url.hostname, getReq);
        return response;
    } catch(error) {
        throw `Request failed: ${wttpUrl.url.hostname} - ${error}`;
    }
}

export async function wttpHead(url: URL | string, options?: HEADOptions): Promise<HEADResponseStruct> {
    url = new URL(url);
    const wttpUrl = await getWttpUrl(url, options?.signer || ethers.Wallet.createRandom());

    try {
        if (!wttpUrl.site) {
            throw `Site is undefined: ${wttpUrl.url.hostname}`;
        }
        await checkWttpHost(wttpUrl.site);
    } catch(error) {
        throw `Invalid WTTP Host: ${error}`;
    }

    try {
        if (!wttpUrl.gateway) {
            throw `Gateway is undefined: ${wttpUrl.url.hostname}`;
        }
        await checkWttpGateway(wttpUrl.gateway);
    } catch(error) {
        throw `Invalid WTTP Gateway: ${error}`;
    }
    
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
        const response = await wttpUrl.gateway.HEAD(wttpUrl.url.hostname, headReq);
        return response;
    } catch(error) {
        throw `Request failed: ${wttpUrl.url.hostname} - ${error}`;
    }
}
