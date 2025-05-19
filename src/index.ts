import { 
    config, 
    WttpConfig, 
    WttpNetworkConfig, 
    WttpGatewayAbi, 
    Web3SiteAbi 
} from "../wttp.config";
import { ethers } from "ethers";
import { HEADRequestStruct, HEADResponseStruct, Web3Site } from "./interfaces/contracts/Web3Site";
import { GETRequestStruct, GETResponseStruct, WTTPGateway } from "./interfaces/contracts/WTTPGateway";

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
        
        if (urlString.startsWith("http")) {
            return fetch(urlString, options);
        } else if (urlString.startsWith("wttp://")) {
            if (!options.signer) {
                options.signer = this.signer || ethers.Wallet.createRandom(); 
                // gets the handler's signer or creates a new one if staticSigner is false
            }
            return this.handleWttpRequest(urlString, options);
        } else if (urlString.startsWith("ipfs://")) {
            return this.handleIpfsRequest(urlString, options);
        } else {
            return this.error505Response();
        }
    }

    private error505Response() {
        return new Response("Not Implemented", { status: 505 });
    }

    public async handleWttpRequest(url: string | URL, options: WttpRequestInit) : Promise<Response> {
        // Convert to string if URL object
        const urlString = url instanceof URL ? url.href : url;
        
        let wttpUrl: WttpUrl;
        try {
            wttpUrl = await this.parseWttpUrl(urlString);
        } catch (error) {
            throw `Parse Error: ${urlString}: ${error}`;
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
        const redirectType = options.redirect || 'follow';

        // Handle 300 Multiple Choices specially
        if (statusCode === 300n && redirectType === 'follow') {
            // 300 Multiple Choices
            // client may pass "Accepts*" headers to specify the type of response, in this
            // case we should perform a GET request on this url to get a directory listing
            // of the available resources so this handler can choose the correct one as per
            // the options.headers directives. If no Accepts* header is passed, we should
            // carry on as a normal redirect to the default redirect location.
            statusCode = 302n; // converts to a temporary redirect once a file is chosen
            // In a full implementation, we would analyze Accept headers and choose the appropriate resource
        }

        // Process redirects (status codes 300-399)
        if (statusCode >= 300n && statusCode < 400n) {
            // Get the redirect URL from the response
            let redirectUrl = headResponse.headerInfo.redirect.location;
            
            if (!redirectUrl) {
                throw new Error(`Redirect status ${statusCode} without a Location header`);
            }
            
            try {
                // Use URL constructor to handle relative URLs properly
                // The second parameter is the base URL to resolve against
                const redirectUrlObj = new URL(redirectUrl, wttpUrl.url.href);
                redirectUrl = redirectUrlObj.href;
            } catch (error) {
                throw `Invalid redirect URL: ${redirectUrl}: ${error}`;
            }
            
            // Handle redirects based on the options.redirect setting
            if (options.redirect === 'error') {
                throw new TypeError(`Redirect status: ${statusCode}`);
            } else if (options.redirect === 'manual') {
                // For manual redirects, return the redirect response with appropriate headers
                const headers = this.createHeadersFromHeadResponse(headResponse);
                return new Response(null, {
                    status: Number(statusCode),
                    headers: headers
                });
            } else if (options.redirect === 'follow') {
                // Recursively call fetch with the new URL
                // Note: In a production environment, you would want to add redirect loop detection
                // by tracking visited URLs or limiting the number of redirects
                return this.fetch(redirectUrl, options);
            }
        }

        if (!options.method || options.method === "GET") {
            const headers = options.headers || {};
            const range = headers && typeof headers === 'object' ? (headers as Record<string, string>)["Range"] : undefined;
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

        // Convert the WTTP response to a standard fetch Response
        if ('head' in wttpResponse) {
            // This is a GETResponseStruct
            const getResponse = wttpResponse as GETResponseStruct;
            const headResponse = getResponse.head;
            
            // Create headers from the HEAD response
            const headers = this.createHeadersFromHeadResponse(headResponse);
            
            // Create response with data
            const statusCode = Number(headResponse.responseLine.code);
            const data = ethers.getBytes(getResponse.data);
            
            return new Response(data, {
                status: statusCode,
                headers: headers
            });
        } else {
            // This is a HEADResponseStruct
            const headResponse = wttpResponse as HEADResponseStruct;
            
            // Create headers from the HEAD response
            const headers = this.createHeadersFromHeadResponse(headResponse);
            
            // Create response with no body (HEAD request)
            const statusCode = Number(headResponse.responseLine.code);
            
            return new Response(null, {
                status: statusCode,
                headers: headers
            });
        }
    }

    public async parseWttpUrl(urlString: string): Promise<WttpUrl> {
        if (!urlString.startsWith("wttp://")) {
            throw `Invalid Wttp URL: ${urlString}`;
        }

        // Create a URL object with a temporary http:// prefix to use URL parsing capabilities
        // We'll replace this with wttp:// later
        const tempUrl = new URL(urlString.replace("wttp://", "http://"));
        const protocol = "WTTP/3.0";
        
        // Extract hostname (without port)
        let host = tempUrl.hostname;
        if (!host) {
            throw `Invalid Wttp URL: ${urlString} - missing host`;
        }
        
        // Default network
        let network: WttpNetworkConfig = this.wttpConfig.networks[0]; 
        
        // Check if network is specified in the port section
        if (tempUrl.port) {
            try {
                network = this.wttpConfig.networks[this.getNetworkAlias(tempUrl.port)];
            } catch (error) {
                throw `Invalid Wttp URL: ${urlString} - invalid network: ${tempUrl.port}: ${error}`;
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
                throw `Invalid Wttp URL: ${urlString} - invalid host: ${host}: ${error}`;
            }
        }

        // Get the path including query parameters and hash
        const path = tempUrl.pathname || "/";
        
        // Create a proper URL object with wttp:// protocol
        const url = new URL(urlString);
        
        return { protocol, network, host, path, url };
    }

    private getNetworkAlias(alias: string): string {
        const aliases: Record<string, string> = {
            "leth": "localhost",
            "31337": "localhost",
            "seth": "sepolia",
            "11155111": "sepolia",
            "eth": "mainnet",
            "1": "mainnet",
        }
        return aliases[alias] || alias;
    }
    
    /**
     * Creates a Headers object from a HEADResponseStruct
     * @param headResponse The HEADResponseStruct to convert
     * @returns A Headers object with all the relevant HTTP headers
     */
    private createHeadersFromHeadResponse(headResponse: HEADResponseStruct): Headers {
        const headers = new Headers();
        
        // Add content type headers
        const mimeType = ethers.decodeBytes32String(headResponse.metadata.mimeType).trim();
        if (mimeType) {
            let contentType = mimeType;
            
            // Add charset if present
            const charset = ethers.decodeBytes32String(headResponse.metadata.charset).trim();
            if (charset) {
                contentType += `; charset=${charset}`;
            }
            
            headers.set('Content-Type', contentType);
        }
        
        // Add content encoding if present
        const encoding = ethers.decodeBytes32String(headResponse.metadata.encoding).trim();
        if (encoding) {
            headers.set('Content-Encoding', encoding);
        }
        
        // Add language if present
        const language = ethers.decodeBytes32String(headResponse.metadata.language).trim();
        if (language) {
            headers.set('Content-Language', language);
        }
        
        // Add ETag
        if (headResponse.etag) {
            headers.set('ETag', headResponse.etag.toString());
        }
        
        // Add Last-Modified
        if (headResponse.metadata.lastModified) {
            const lastModified = new Date(Number(headResponse.metadata.lastModified) * 1000);
            headers.set('Last-Modified', lastModified.toUTCString());
        }
        
        // Add Content-Length
        if (headResponse.metadata.size) {
            headers.set('Content-Length', headResponse.metadata.size.toString());
        }
        
        // Add Cache-Control headers
        const cacheControl = [];
        if (headResponse.headerInfo.cache.maxAge) {
            cacheControl.push(`max-age=${headResponse.headerInfo.cache.maxAge}`);
        }
        // Note: The following properties might not be available in all contract versions
        // We're checking for their existence before using them
        const cache = headResponse.headerInfo.cache as any;
        
        if (cache.sMaxage) {
            cacheControl.push(`s-maxage=${cache.sMaxage}`);
        }
        if (headResponse.headerInfo.cache.noStore) {
            cacheControl.push('no-store');
        }
        if (headResponse.headerInfo.cache.noCache) {
            cacheControl.push('no-cache');
        }
        if (headResponse.headerInfo.cache.immutableFlag) {
            cacheControl.push('immutable');
        }
        if (headResponse.headerInfo.cache.publicFlag) {
            cacheControl.push('public');
        }
        if (cache.mustRevalidate) {
            cacheControl.push('must-revalidate');
        }
        if (cache.proxyRevalidate) {
            cacheControl.push('proxy-revalidate');
        }
        if (cache.mustUnderstand) {
            cacheControl.push('must-understand');
        }
        if (cache.staleWhileRevalidate) {
            cacheControl.push(`stale-while-revalidate=${cache.staleWhileRevalidate}`);
        }
        if (cache.staleIfError) {
            cacheControl.push(`stale-if-error=${cache.staleIfError}`);
        }
        
        if (cacheControl.length > 0) {
            headers.set('Cache-Control', cacheControl.join(', '));
        }
        
        // Add Allow header for supported methods
        if (headResponse.headerInfo.methods) {
            const methodsValue = Number(headResponse.headerInfo.methods);
            const methods = [];
            
            if (methodsValue & 1) methods.push('HEAD');
            if (methodsValue & 2) methods.push('GET');
            if (methodsValue & 4) methods.push('PUT');
            if (methodsValue & 8) methods.push('DELETE');
            if (methodsValue & 16) methods.push('PATCH');
            if (methodsValue & 32) methods.push('OPTIONS');
            if (methodsValue & 64) methods.push('DEFINE');
            if (methodsValue & 128) methods.push('LOCATE');
            
            if (methods.length > 0) {
                headers.set('Allow', methods.join(', '));
            }
        }
        
        // Add Location header for redirects
        if (headResponse.headerInfo.redirect && headResponse.headerInfo.redirect.location) {
            headers.set('Location', headResponse.headerInfo.redirect.location);
        }
        
        return headers;
    }

    public handleIpfsRequest(url: string | URL, options: RequestInit) : Promise<Response> {
        // TODO: implement
        const urlString = url instanceof URL ? url.href : url;
        return new Promise((resolve, reject) => {
            reject(new Error(`IPFS protocol not implemented for URL: ${urlString}`));
        });
    }
}


