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

interface WttpRequestInit extends RequestInit {
    signer?: ethers.Signer;
}

export class WttpHandler {
    private wttpConfig: WttpConfig;
    private signer: ethers.Signer | undefined;

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
            options.signer = this.signer || ethers.Wallet.createRandom(); 
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
        const PROTOCOL_VERSION = "WTTP/3.0";
        
        let wttpUrl: WttpUrl;
        try {
            wttpUrl = await this.validateWttpUrl(url);
        } catch (error) {
            throw `URL Error: ${url.href}: ${error}`;
        }

        const provider = new ethers.JsonRpcProvider(wttpUrl.network.rpcList[0], wttpUrl.network.chainId);
        
        const web3Site = new ethers.Contract(
            wttpUrl.url.hostname, 
            Web3SiteAbi, 
            provider
        ).connect(options.signer || null) as Web3Site;

        const failHeadRequest: HEADRequestStruct = {
            requestLine: {
                protocol: PROTOCOL_VERSION,
                path: "404", // should return 404 since the path doesn't start with a /
                method: 0
            },
            ifModifiedSince: 0,
            ifNoneMatch: "0x0000000000000000000000000000000000000000"
        }

        try {
            const siteFailResponse = await web3Site.HEAD(failHeadRequest);
            // if the HEAD request returns a 404, then the host is not a valid Web3Site contract
            const statusCode = siteFailResponse.responseLine.code;
            if (statusCode !== 404n) {
                throw `Site responded with ${statusCode} instead of 404`;
            }
        } catch(error) {
            throw `Invalid WTTP Host: ${wttpUrl.url.hostname} - invalid contract: ${error}`;
        }

        const wttpGateway = new ethers.Contract(
            wttpUrl.network.gateway, 
            WttpGatewayAbi, 
            provider
        ).connect(options.signer || null) as WTTPGateway;

        try {
            const wttpFailResponse = await wttpGateway.HEAD(wttpUrl.url.hostname, failHeadRequest);
            const statusCode = wttpFailResponse.responseLine.code;
            if (statusCode !== 404n) {
                throw `Gateway responded with ${statusCode} instead of 404`;
            }
        } catch(error) {
            throw `Invalid WTTP Gateway: ${wttpUrl.network.gateway}: ${error}`;
        }

        const headRequest: HEADRequestStruct = {
            requestLine: {
                protocol: PROTOCOL_VERSION,
                path: wttpUrl.url.pathname,
                method: 0
            },
            ifModifiedSince: options.headers?.["If-Modified-Since"] || 0,
            ifNoneMatch: options.headers?.["If-None-Match"] || ethers.ZeroHash
        }

        const headResponse: HEADResponseStruct = await wttpGateway.HEAD(wttpUrl.url.hostname, headRequest);

        let statusCode = BigInt(headResponse.responseLine.code);
        statusCode = statusCode === 0n ? 500n : statusCode; // 0n is an error, set to 500n
        let redirectUrl: string = headResponse.headerInfo.redirect.location;
        const redirectType = options.redirect || 'follow';

        if (statusCode === 300n && redirectType === 'follow') {
            // 300 Multiple Choices
            // client may pass "Accepts*" headers to specify the type of response, in this
            // case we should perform a GET request on this url to get a directory listing
            // of the available resources so this handler can choose the correct one as per
            // the options.headers directives. If no Accepts* header is passed, we should
            // carry on as a normal redirect to the default redirect location.
            statusCode = 302n; // converts to a temporary redirect once a file is chosen
            redirectUrl = headResponse.headerInfo.redirect.location;
            // replace redirectUrl with the file this handler chooses based on the client request
        }

        if (redirectUrl) {
            try {
                // Use URL constructor to handle relative URLs properly
                // The second parameter is the base URL to resolve against
                const redirectUrlObj = new URL(redirectUrl, wttpUrl.url.href);
                redirectUrl = redirectUrlObj.href;
            } catch (error) {
                throw `Invalid redirect URL: ${redirectUrl}: ${error}`;
            }
        }

        if (statusCode < 300n) {
            // success response

        } else if (statusCode >= 300n && statusCode < 400n) {
            // redirect response
            // all redirect codes are to find the final end-point
            // recursively call fetch with the new url
            // must detect if the redirect is a loop
            if (options.redirect === 'error') {
                return new Promise((resolve, reject) => {
                    reject(new Error("Redirect found"));
                });
            }

        } else if (statusCode >= 400n && statusCode < 500n) {
            // client error response

        }

        let wttpResponse: GETResponseStruct | HEADResponseStruct;
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
            wttpResponse = await wttpGateway.GET(wttpUrl.host, getRequest);
            
        } else if (options.method === "HEAD") {
            wttpResponse = await wttpGateway.HEAD(wttpUrl.host, headRequest);
        } else {
            return new Promise((resolve, reject) => {
                reject(new Error("Not implemented"));
            });
        }

        return new Promise((resolve, reject) => {
            reject(new Error("Not implemented"));
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


