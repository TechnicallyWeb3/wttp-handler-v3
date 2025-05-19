import { 
    config, 
    WttpConfig, 
    WttpNetworkConfig, 
    WttpGatewayAbi, 
    Web3SiteAbi 
} from "../wttp.config";
import { ethers } from "ethers";
import { HEADRequestStruct, HEADResponseStruct, Web3Site } from "./interfaces/contracts/Web3Site.ts";
import { GETRequestStruct, GETResponseStruct, WTTPGateway } from "./interfaces/contracts/WTTPGateway.ts";

export type WttpHandlerConfig = {
    wttpConfig: WttpConfig;
    staticSigner?: boolean;
    signer?: ethers.Signer;
};

export type WttpUrl = {
    network: WttpNetworkConfig;
    url: URL;
};

export type WttpProvider = {
    provider: ethers.JsonRpcProvider;
    signer: ethers.Signer;
    gateway: WTTPGateway;
    site: Web3Site;
};

export type WttpResponseHeaders = {
    statusCode: number;
    statusText: string;
    mimeType: string;
    charset: string;
    encoding: string;
    language: string;
    version: number;
    lastModified: number;
    etag: string;
}

export type WttpResponse = {
    headers: WttpResponseHeaders;
    body: string;
}

interface WttpRequestInit extends RequestInit {
    signer?: ethers.Signer;
}



export class WttpHandler {
    private wttpConfig: WttpConfig;
    private signer: ethers.Signer | undefined;
    private WTTP_VERSION = "WTTP/3.0";

    constructor(_handlerConfig: WttpHandlerConfig) {
        this.wttpConfig = _handlerConfig.wttpConfig;
        if (_handlerConfig.staticSigner && _handlerConfig.signer) {
            this.signer = _handlerConfig.signer || ethers.Wallet.createRandom();
        } else {
            this.signer = undefined;
        }
    }

    async fetch(
        url: string | URL,
        options: WttpRequestInit = {}
    ) : Promise<Response> {
        // Convert to string if URL object
        const urlString = url instanceof URL ? url.href : url;
        url = new URL(urlString);
        
        if (url.protocol.startsWith("http")) {
            return fetch(url, options);
        } else if (url.protocol.startsWith("wttp")) {
            return this.handleWttpRequest(url, options);
        } else if (url.protocol.startsWith("ipfs")) {
            return this.handleIpfsRequest(url, options);
        } else {
            return this.error505Response();
        }
    }

    private error505Response() {
        return new Response("Not Implemented", { status: 505 });
    }

    public async handleWttpRequest(url: URL, options: WttpRequestInit) : Promise<Response> {
        
        let wttpUrl: WttpUrl;
        try {
            wttpUrl = await this.validateWttpUrl(url);
        } catch (error) {
            throw `URL Error: ${url.href}: ${error}`;
        }

        let wttpProvider: WttpProvider;
        options.signer = options.signer || this.signer || ethers.Wallet.createRandom(); 

        try {
            wttpProvider = await this.getWttpProvider(wttpUrl, options.signer);
        } catch (error) {
            throw `Provider Error: ${url.href}: ${error}`;
        }
        
        const headRequest: HEADRequestStruct = {
            requestLine: {
                protocol: this.WTTP_VERSION,
                path: wttpUrl.url.pathname,
                method: 0
            },
            ifModifiedSince: options.headers?.["If-Modified-Since"] || 0,
            ifNoneMatch: options.headers?.["If-None-Match"] || ethers.ZeroHash
        }

        const headResponse: HEADResponseStruct = await wttpProvider.gateway.HEAD(wttpUrl.url.hostname, headRequest);

        let statusCode = Number(headResponse.responseLine.code);
        statusCode = statusCode === 0 ? 500 : statusCode; // 0n is an error, set to 500n
        const redirectType = options.redirect || 'follow';

        if (redirectType === 'error' && statusCode >= 300 && statusCode < 400) {
            return new Promise((resolve, reject) => {
                reject(new Error("Redirect Error: Redirect found, to avoid this error, leave the redirect option empty or set to 'manual'"));
            });
        }

        if (
            options.method === 'HEAD' || // HEAD request, no body
            statusCode === 304 || // 304 Not Modified, no body, use cached response
            (statusCode >= 300 && redirectType !== 'follow') || // not following redirect
            statusCode >= 400 // error, no body
        ) { // return the response as is, no need to continue with a GET request
            return this.parseWttpResponse(headResponse);
        }

        if (statusCode >= 300 && redirectType === 'follow') {
            // redirect response
            let redirectUrl: string = headResponse.headerInfo.redirect.location;

            if (statusCode === 300) {
                // 300 Multiple Choices
                // client may pass "Accepts*" headers to specify the type of response, in this
                // case we should perform a GET request on this url to get a directory listing
                // of the available resources so this handler can choose the correct one as per
                // the options.headers directives. If no Accepts* header is passed, we should
                // carry on as a normal redirect to the default redirect location.
                statusCode = 302; // converts to a temporary redirect once a file is chosen
                redirectUrl = headResponse.headerInfo.redirect.location || './index.html';
                // replace redirectUrl with the file this handler chooses based on the client request
            }

            if (redirectUrl.startsWith(".")) {
                // relative redirect, convert to absolute
                // CHECK: does this work for parent and child relative paths?
                redirectUrl = new URL(redirectUrl, wttpUrl.url.origin).href;
            }
            
            // TODO: get recursive in here
            // TODO: detect if the redirect is a loop


        }

        if (!options.method || options.method === "GET") {
            const headers = options.headers || {};
            const range = headers["Range"] || undefined;
            let rangeStart: bigint = 0n;
            let rangeEnd: bigint = 0n;
            if (range) {
                const rangeParts: string[] = range.split("-");
                rangeStart = BigInt(rangeParts[0].trim()) || 0n;
                rangeEnd = BigInt(rangeParts[1].trim()) || 0n;
            }
            const getRequest: GETRequestStruct = {
                head: headRequest,
                rangeBytes: {
                    start: rangeStart,
                    end: rangeEnd
                }
            }
            const getResponse = await wttpProvider.gateway.GET(wttpUrl.url.hostname, getRequest);
            return this.parseWttpResponse(getResponse);
        }

        return new Promise((resolve, reject) => {
            reject(new Error("Not Implemented"));
        });
    }

    public async validateWttpUrl(url: URL): Promise<WttpUrl> {
        if (!url.protocol.startsWith("wttp")) {
            throw `Invalid Wttp URL: ${url.protocol} - invalid protocol`;
        }
        
        // Extract hostname (without port)
        let host = url.hostname;
        if (!host) {
            throw `Invalid WTTP URL: ${url} - missing host`;
        }
        
        // Default network
        let network: WttpNetworkConfig = this.wttpConfig.networks[0]; 
        
        // Check if network is specified in the port section
        if (url.port) {
            try {
                url.port = this.getNetworkAlias(url.port);
                network = this.wttpConfig.networks[url.port];
            } catch (error) {
                throw `Invalid WTTP URL: ${url.port} - invalid network: ${error}`;
            }
        }

        // If the host is an ENS name, resolve it
        if (host.endsWith('.eth')) {
            const rpcUrl = network.rpcList[0];
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            try {
                const resolved = await provider.resolveName(host);
                if (resolved) {
                    host = resolved;
                }
            } catch (error) {
                throw `Invalid WTTP URL: ${host} - invalid ENS name: ${error}`;
            }
        }
        
        try {
            // use ethers to validate the host is a valid address/domain
            host = ethers.getAddress(host);
            ethers.isAddress(host);
        } catch (error) {
            throw `Invalid WTTP URL: ${host} - invalid ethers address: ${error}`;
        }

        // Set the fully resolved and checksummed host
        url.hostname = host;

        // Get the path including query parameters and hash
        url.pathname = url.pathname || "/";
        
        return { network, url };
    }

    public async getWttpProvider(wttpUrl: WttpUrl, signer: ethers.Signer): Promise<WttpProvider> {
        const provider = new ethers.JsonRpcProvider(wttpUrl.network.rpcList[0], wttpUrl.network.chainId);
        const site = new ethers.Contract(
            wttpUrl.url.hostname, 
            Web3SiteAbi, 
            provider
        ).connect(signer) as Web3Site;

        const failHeadRequest: HEADRequestStruct = {
            requestLine: {
                protocol: this.WTTP_VERSION,
                path: "404", // should return 404 since the path doesn't start with a /
                method: 0
            },
            ifModifiedSince: 0,
            ifNoneMatch: "0x0000000000000000000000000000000000000000"
        }

        try {
            const siteFailResponse = await site.HEAD(failHeadRequest);
            // if the HEAD request returns a 404, then the host is not a valid Web3Site contract
            const statusCode = siteFailResponse.responseLine.code;
            if (statusCode !== 404n) {
                throw `Site responded with ${statusCode} instead of 404`;
            }
        } catch(error) {
            throw `Invalid WTTP Host: ${wttpUrl.url.hostname} - invalid contract: ${error}`;
        }

        const gateway = new ethers.Contract(
            wttpUrl.network.gateway, 
            WttpGatewayAbi, 
            provider
        ).connect(signer || null) as WTTPGateway;

        try {
            const wttpFailResponse = await gateway.HEAD(wttpUrl.url.hostname, failHeadRequest);
            const statusCode = wttpFailResponse.responseLine.code;
            if (statusCode !== 404n) {
                throw `Gateway responded with ${statusCode} instead of 404`;
            }
        } catch(error) {
            throw `Invalid WTTP Gateway: ${wttpUrl.network.gateway}: ${error}`;
        }

        return { provider, signer, gateway, site };
    }

    private parseWttpResponse(response: HEADResponseStruct | GETResponseStruct): Response {
        // TODO: implement
        return new Response()
    }

    private getNetworkAlias(alias: string): string {
        const aliases = {
            "leth": "localhost",
            "31337": "localhost",
            "seth": "sepolia",
            "11155111": "sepolia",
            "eth": "mainnet",
            "1": "mainnet",
        }
        return aliases[alias] || alias;
    }

    public handleIpfsRequest(url: string | URL, options: RequestInit) : Promise<Response> {
        // TODO: implement
        const urlString = url instanceof URL ? url.href : url;
        return new Promise((resolve, reject) => {
            reject(new Error(`IPFS protocol not implemented for URL: ${urlString}`));
        });
    }
}


