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

export const WTTP_VERSION = "WTTP/3.0";

export function formatEthereumAddress(address: string | ethers.Addressable): string {
    try {
        // use ethers to validate the host is a valid address
        const checksumAddress = ethers.getAddress(String(address));
        // ethers.isAddress(checksumAddress); // try/catch implemented, so this is not needed
        return checksumAddress;
    } catch (error) {
        throw `Invalid Ethereum address: ${address} - ${error}`;
    }
}

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

export async function getWttpUrl(url: URL | string): Promise<WttpUrl> {
    url = new URL(url);
    if (!url.protocol.startsWith('wttp')) {
        // console.log(`Protocol not supported: ${url.protocol}`);
        throw `Invalid WTTP URL: ${url.protocol} - URL must start with wttp://`;
    }

    const networkName = url.port || String(config.networks[Object.keys(config.networks)[0]].chainId);
    const network = getNetworkAlias(networkName);
    url.port = networkName;

    try {
        const hostAddress = await getHostAddress(url);
        url.host = hostAddress;
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

export async function getHostAddress(url: string | URL): Promise<string> {
    url = new URL(url);
    const host = url.hostname;
    if (host.endsWith('.eth')) {
        return await resolveEnsName(host);
    }
    return formatEthereumAddress(host);
}

export function getGatewayAddress(url: URL | string): string {
    url = new URL(url);
    const networkAlias = getNetworkAlias(url.port);
    const networkKeys = Object.keys(config.networks);
    const network = networkAlias ? config.networks[networkAlias] : config.networks[networkKeys[0]];
    return formatEthereumAddress(network.gateway);
}

// modifies the url in the return, when returning the response to the client, use the original url
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
        // not technically needed, but good to have, in future needed for write methods
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

const failHeadRequest: HEADRequestStruct = {
    requestLine: {
        protocol: WTTP_VERSION,
        path: "404", // should return 404 since the path doesn't start with a /
        method: 0
    },
    ifModifiedSince: 0n,
    ifNoneMatch: ethers.ZeroHash,
}

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

export async function checkWttpGateway(gateway: WTTPGatewayV3, host: string | ethers.Addressable): Promise<boolean> {
    try {
        await gateway.HEAD(host, failHeadRequest); // a successful call means the gateway is valid
        return true;
    } catch(error) {
        return false;
        // should throw a 502 Bad Gateway error upstream
    }
}

export async function wttpGet(url: URL | string, options?: GETOptions): Promise<GETResponseStruct> {
    url = new URL(url);
    
    let wttpUrl: WttpUrl = await getWttpUrl(url);
    let wttpProvider: WttpProvider = await getWttpProvider(wttpUrl, options?.signer);

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
        const response = await wttpProvider.gateway.GET(wttpUrl.host, getReq);
        return response;
    } catch(error) {
        let statusCode: bigint = 500n;
        if (wttpProvider.gateway && !checkWttpGateway(wttpProvider.gateway, wttpUrl.host)) {
            statusCode = 502n;
            if (wttpProvider.host && !checkWttpHost(wttpProvider.host)) {
                statusCode = 501n;
            }
        }

        // return an empty 500, 501, or 502 error
        return wttpErrorResponse(statusCode);
    }
}

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

export async function wttpHead(url: URL | string, options?: HEADOptions): Promise<HEADResponseStruct> {
    url = new URL(url);

    let wttpUrl: WttpUrl;
    try {
        wttpUrl = await getWttpUrl(url);
    } catch(error) {
        throw `Invalid WTTP URL: ${error}`;
    }

    let wttpProvider: WttpProvider;
    try {
        wttpProvider = await getWttpProvider(wttpUrl, options?.signer);
    } catch(error) {
        throw `Failed to mount WTTP Provider: ${error}`;
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
        const response = await wttpProvider.gateway.HEAD(wttpUrl.host, headReq);
        return response;
    } catch(error) {
        let statusCode: bigint = 500n;
        if (wttpProvider.gateway && !checkWttpGateway(wttpProvider.gateway, wttpUrl.host)) {
            statusCode = 502n;
            if (wttpProvider.host && !checkWttpHost(wttpProvider.host)) {
                statusCode = 501n;
            }
        }

        // return an empty 500, 501, or 502 error
        return wttpErrorResponse(statusCode, wttpUrl).head;
    }
}
