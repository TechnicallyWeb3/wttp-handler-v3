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
    protocol: string;
    network: WttpNetworkConfig;
    host: string;
    path: string;
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
        url: string,
        options: WttpRequestInit = {}
    ) : Promise<Response> {
        if (url.startsWith("http")) {
            return fetch(url, options);
        } else if (url.startsWith("wttp://")) {
            if (!options.signer) {
                options.signer = this.signer || ethers.Wallet.createRandom(); 
                // gets the handler's signer or creates a new one if staticSigner is false
            }
            return this.handleWttpRequest(url, options);
        } else if (url.startsWith("ipfs://")) {
            return this.handleIpfsRequest(url, options);
        } else {
            return this.error505Response();
        }
    }

    private error505Response() {
        return new Response("Not Implemented", { status: 505 });
    }

    public async handleWttpRequest(url: string, options: WttpRequestInit) : Promise<Response> {
        let wttpUrl: WttpUrl;
        try {
            wttpUrl = await this.parseWttpUrl(url);
        } catch (error) {
            throw `Parse Error: ${url}: ${error}`;
        }
        const provider = new ethers.JsonRpcProvider(wttpUrl.network.rpcList[0], wttpUrl.network.chainId);
        
        const web3Site = new ethers.Contract(
            wttpUrl.host, 
            Web3SiteAbi, 
            provider
        ).connect(options.signer || null) as Web3Site;

        const failHeadRequest: HEADRequestStruct = {
            requestLine: {
                protocol: "WTTP/3.0",
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
            throw `Invalid WTTP Host: ${wttpUrl.host} - invalid contract: ${error}`;
        }

        const wttpGateway = new ethers.Contract(
            wttpUrl.network.gateway, 
            WttpGatewayAbi, 
            provider
        ).connect(options.signer || null) as WTTPGateway;

        try {
            const wttpFailResponse = await wttpGateway.HEAD(wttpUrl.host, failHeadRequest);
            const statusCode = wttpFailResponse.responseLine.code;
            if (statusCode !== 404n) {
                throw `Gateway responded with ${statusCode} instead of 404`;
            }
        } catch(error) {
            throw `Invalid WTTP Gateway: ${wttpUrl.network.gateway}: ${error}`;
        }

        let wttpResponse: GETResponseStruct | HEADResponseStruct;
        let response: Response = new Response();

        const headRequest: HEADRequestStruct = {
            requestLine: {
                protocol: "WTTP/3.0",
                path: wttpUrl.path,
                method: 0
            },
            ifModifiedSince: 0,
            ifNoneMatch: "0x0000000000000000000000000000000000000000"
        }

        const headResponse: HEADResponseStruct = await wttpGateway.HEAD(wttpUrl.host, headRequest);

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

        if (redirectUrl.startsWith("..")) {
            // relative redirect to a parent directory

        }else if (redirectUrl.startsWith(".")) {
            // relative redirect
            
            // redirectUrl = new URL(redirectUrl, url).toString();
            // oh I like this better, we'll need to update this handler to use URL objects. 
            // I'll do that later.
            const relativePath = redirectUrl.slice(1);
            redirectUrl = url.slice(0, wttpUrl.path.length) + relativePath;
            // this is exactly why we need the URL object, path may exclude ? and # parts.
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

    public async parseWttpUrl(url: string): Promise<WttpUrl> {
        if (!url.startsWith("wttp://")) {
            throw `Invalid Wttp URL: ${url}`;
        }

        url = url.slice(7);
        const protocol = "WTTP/3.0";

        const urlParts = url.split("/");
        if (!urlParts[0]) {
            throw `Invalid Wttp URL: ${url} - missing host`;
        }
        
        let host = urlParts[0];
        let network:WttpNetworkConfig = this.wttpConfig.networks[0]; // pick the first network as default

        const hostParts = host.split(":");
        if (hostParts.length > 1) {
            host = hostParts[0];
            try {
                network = this.wttpConfig.networks[this.getNetworkAlias(hostParts[1])];
            } catch (error) {
                throw `Invalid Wttp URL: ${url} - invalid network: ${hostParts[1]}: ${error}`;
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
                throw `Failed to resolve ENS name ${host}: ${error}`;
            }
        } else {
            try {
                // use ethers to validate the host is a valid address/domain
                ethers.getAddress(host);
                // doesn't need to be saved (host = ...) because if it is an invalid address, it will throw an error
            } catch (error) {
                throw `Invalid Wttp URL: ${url} - invalid host: ${host}: ${error}`;
            }
        }

        const pathParts = urlParts.slice(1);
        const path = `/${pathParts.join("/")}`;
        
        return { protocol, network, host, path };
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

    public handleIpfsRequest(url: string, options: RequestInit) : Promise<Response> {
        // TODO: implement
        return new Promise((resolve, reject) => {
            reject(new Error("Not implemented"));
        });
    }
}


