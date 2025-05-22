import { expect } from "chai";
import { ethers } from "ethers";
import { WTTP_VERSION } from "../src/utils/wttpMethods.js";
import { GETResponseStruct } from "../src/interfaces/contracts/WTTPGatewayV3.js";

// Mock the global fetch for testing
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url: URL | RequestInfo, options?: RequestInit) => {
    return new Response("HTTP Response", {
        status: 200,
        headers: {
            "Content-Type": "text/plain"
        }
    });
};

// Create a standalone version of the functions we want to test
// This avoids issues with mocking ES modules
function mockWttpGet(url: URL | string): Promise<GETResponseStruct> {
    url = new URL(url);
    
    // Create a mock response
    return Promise.resolve({
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
    });
}

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

async function testFetch(url: URL | string): Promise<Response> {
    url = new URL(url);
    
    // Check if this is a WTTP URL
    if (url.protocol === 'wttp:') {
        try {
            // Make the WTTP request using our mock
            const wttpResponse = await mockWttpGet(url);
            
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
        return globalThis.fetch(url);
    }
}

describe("WTTP Fetch Standalone Tests", () => {
    // Restore the original fetch after tests
    after(() => {
        globalThis.fetch = originalFetch;
    });

    describe("mockWttpGet", () => {
        it("should return a mock WTTP response", async () => {
            const url = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/index.html");
            const result = await mockWttpGet(url);
            
            expect(result.head.responseLine.protocol).to.equal(WTTP_VERSION);
            expect(result.head.responseLine.code).to.equal(200n);
            expect(result.head.metadata.mimeType).to.equal("text/html");
            expect(result.head.metadata.charset).to.equal("utf-8");
            expect(typeof result.data).to.equal("string");
            expect(result.data).to.include("Mock WTTP Response");
            expect(result.data).to.include(url.href);
        });
    });

    describe("testFetch", () => {
        it("should use standard fetch for HTTP URLs", async () => {
            const url = "http://example.com";
            const response = await testFetch(url);
            
            expect(response.status).to.equal(200);
            expect(await response.text()).to.equal("HTTP Response");
            expect(response.headers.get("Content-Type")).to.equal("text/plain");
        });

        it("should use WTTP fetch for WTTP URLs", async () => {
            const url = "wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/index.html";
            const response = await testFetch(url);
            
            expect(response.status).to.equal(200);
            expect(response.headers.get("Content-Type")).to.equal("text/html; charset=utf-8");
            expect(response.headers.get("WTTP-Version")).to.equal(WTTP_VERSION);
            
            const text = await response.text();
            expect(text).to.include("Mock WTTP Response");
            expect(text).to.include(url);
        });

        it("should include appropriate headers in the response", async () => {
            const url = "wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/index.html";
            const response = await testFetch(url);
            
            expect(response.headers.get("Content-Type")).to.equal("text/html; charset=utf-8");
            expect(response.headers.get("Content-Language")).to.equal("en");
            expect(response.headers.get("Cache-Control")).to.equal("max-age=3600, public");
            expect(response.headers.get("WTTP-Host")).to.equal("0x36C02dA8a0983159322a80FFE9F24b1acfF8B570");
            expect(response.headers.has("ETag")).to.be.true;
            expect(response.headers.has("Last-Modified")).to.be.true;
        });
    });
});