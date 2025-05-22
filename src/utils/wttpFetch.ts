/**
 * WTTP Fetch Module
 * 
 * This module extends the standard fetch API to support WTTP protocol.
 * It allows making requests to both HTTP and WTTP resources using a unified interface.
 */

import { ethers } from "ethers";
import { 
    wttpGet,
    wttpHead,
    WTTP_VERSION
} from "./wttpMethods";
import { 
    GETOptions,
    WttpHandlerConfig
} from "../interfaces/WTTPTypes";
import { GETResponseStruct } from "../interfaces/contracts/WTTPGatewayV3";

/**
 * Configuration for the WTTP handler
 */
let handlerConfig: WttpHandlerConfig | null = null;

/**
 * Initializes the WTTP handler with configuration
 * 
 * @param config - Configuration for the WTTP handler
 */
export function initWttpHandler(config: WttpHandlerConfig): void {
    handlerConfig = config;
}

/**
 * Converts a WTTP response to a standard fetch Response object
 * 
 * @param wttpResponse - The WTTP response from the contract
 * @param url - The URL that was requested
 * @returns A standard fetch Response object
 */
function convertWttpResponseToFetchResponse(wttpResponse: GETResponseStruct, url: URL): Response {
    // Extract status code
    const status = Number(wttpResponse.head.responseLine.code);
    
    // Extract headers
    const headers = new Headers();
    
    // Add content type if available
    if (wttpResponse.head.metadata.mimeType) {
        let contentType = String(wttpResponse.head.metadata.mimeType);
        if (wttpResponse.head.metadata.charset) {
            contentType += `; charset=${String(wttpResponse.head.metadata.charset)}`;
        }
        headers.set("Content-Type", contentType);
    }
    
    // Add content encoding if available
    if (wttpResponse.head.metadata.encoding) {
        headers.set("Content-Encoding", String(wttpResponse.head.metadata.encoding));
    }
    
    // Add content language if available
    if (wttpResponse.head.metadata.language) {
        headers.set("Content-Language", String(wttpResponse.head.metadata.language));
    }
    
    // Add content length if available
    if (wttpResponse.head.metadata.size) {
        headers.set("Content-Length", wttpResponse.head.metadata.size.toString());
    }
    
    // Add ETag if available
    if (wttpResponse.head.etag && wttpResponse.head.etag !== ethers.ZeroHash) {
        headers.set("ETag", String(wttpResponse.head.etag));
    }
    
    // Add Last-Modified if available
    if (wttpResponse.head.metadata.lastModified) {
        const lastModified = new Date(Number(wttpResponse.head.metadata.lastModified) * 1000);
        headers.set("Last-Modified", lastModified.toUTCString());
    }
    
    // Add cache control headers
    const cacheControl = [];
    if (Number(wttpResponse.head.headerInfo.cache.maxAge) > 0) {
        cacheControl.push(`max-age=${wttpResponse.head.headerInfo.cache.maxAge}`);
    }
    if (wttpResponse.head.headerInfo.cache.noStore) {
        cacheControl.push("no-store");
    }
    if (wttpResponse.head.headerInfo.cache.noCache) {
        cacheControl.push("no-cache");
    }
    if (wttpResponse.head.headerInfo.cache.immutableFlag) {
        cacheControl.push("immutable");
    }
    if (wttpResponse.head.headerInfo.cache.publicFlag) {
        cacheControl.push("public");
    }
    if (cacheControl.length > 0) {
        headers.set("Cache-Control", cacheControl.join(", "));
    }
    
    // Add WTTP protocol version
    headers.set("WTTP-Version", WTTP_VERSION);
    
    // Add WTTP-Host
    headers.set("WTTP-Host", url.hostname);
    
    // Handle redirects
    if (Number(wttpResponse.head.headerInfo.redirect.code) > 0) {
        const redirectCode = Number(wttpResponse.head.headerInfo.redirect.code);
        const location = wttpResponse.head.headerInfo.redirect.location;
        
        // Set the Location header for redirects
        if (location) {
            // Handle relative URLs
            const redirectUrl = location.startsWith("/") || location.startsWith("http") || location.startsWith("wttp") 
                ? location 
                : new URL(location, url).href;
            headers.set("Location", redirectUrl);
        }
    }
    
    // Create response body from the data
    let body: BodyInit | null = null;
    if (wttpResponse.data) {
        // Convert the data to a Uint8Array if it's a hex string
        if (typeof wttpResponse.data === 'string' && wttpResponse.data.startsWith('0x')) {
            body = ethers.getBytes(wttpResponse.data);
        } else {
            // Otherwise, use the data as is
            body = wttpResponse.data as string;
        }
    }
    
    // Create and return the Response object
    return new Response(body, {
        status,
        headers,
    });
}

/**
 * Mock WTTP GET function for testing
 * Returns a static result for any WTTP request
 * 
 * @param url - The URL to request
 * @returns A mock WTTP response
 */
export async function mockWttpGet(url: URL | string): Promise<GETResponseStruct> {
    url = new URL(url);
    
    // Create a mock response
    return {
        head: {
            responseLine: {
                protocol: WTTP_VERSION,
                code: 200n
            },
            headerInfo: {
                methods: 1n, // GET method
                cache: {
                    maxAge: 3600n,
                    noStore: false,
                    noCache: false,
                    immutableFlag: false,
                    publicFlag: true
                },
                redirect: {
                    code: 0n,
                    location: ''
                },
                resourceAdmin: ethers.ZeroAddress
            },
            metadata: {
                mimeType: 'text/html',
                charset: 'utf-8',
                encoding: '',
                language: 'en',
                size: BigInt(url.pathname === '/large' ? 1024 : 256),
                version: 1n,
                lastModified: BigInt(Math.floor(Date.now() / 1000) - 3600),
                header: ethers.ZeroHash
            },
            etag: ethers.keccak256(ethers.toUtf8Bytes(`mock-etag-${url.pathname}`))
        },
        bytesRange: {
            start: 0n,
            end: url.pathname === '/large' ? 1024n : 256n
        },
        data: `<!DOCTYPE html>
<html>
<head>
    <title>Mock WTTP Response</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>Mock WTTP Response</h1>
    <p>This is a mock response for testing the WTTP fetch implementation.</p>
    <p>Requested URL: ${url.href}</p>
    <p>Pathname: ${url.pathname}</p>
</body>
</html>`
    };
}

/**
 * Extended fetch function that supports both HTTP and WTTP protocols
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options, including WTTP-specific options
 * @returns A Promise that resolves to a Response object
 */
export async function fetch(url: URL | string, options: RequestInit & { wttpOptions?: GETOptions } = {}): Promise<Response> {
    url = new URL(url);
    
    // Check if this is a WTTP URL
    if (url.protocol === 'wttp:') {
        // Extract WTTP-specific options
        const wttpOptions = options.wttpOptions || {};
        
        // Use the static signer from the handler config if available and enabled
        if (handlerConfig && handlerConfig.staticSigner && !wttpOptions.signer) {
            wttpOptions.signer = handlerConfig.signer;
        }
        
        try {
            // Make the WTTP request
            const wttpResponse = await wttpGet(url, wttpOptions);
            
            // Convert the WTTP response to a fetch Response
            return convertWttpResponseToFetchResponse(wttpResponse, url);
        } catch (error) {
            // Handle errors
            console.error('WTTP fetch error:', error);
            
            // Return a Response with an error status
            return new Response(`WTTP fetch error: ${error}`, {
                status: 500,
                headers: {
                    'Content-Type': 'text/plain',
                    'WTTP-Error': String(error)
                }
            });
        }
    } else {
        // For HTTP URLs, use the standard fetch
        return globalThis.fetch(url, options);
    }
}

export default fetch;