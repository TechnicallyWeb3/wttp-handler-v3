import { expect } from "chai";
import { ethers } from "ethers";
import { fetch, mockWttpGet } from "../src/utils/wttpFetch.js";
import { WTTP_VERSION } from "../src/utils/wttpMethods.js";

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

// Mock the wttpGet function to use our mockWttpGet
import * as wttpMethods from "../src/utils/wttpMethods.js";
const originalWttpGet = wttpMethods.wttpGet;
// @ts-ignore - Overriding the function for testing
wttpMethods.wttpGet = mockWttpGet;

describe("WTTP Fetch Mock Tests", () => {
    // Restore the original functions after tests
    after(() => {
        globalThis.fetch = originalFetch;
        // @ts-ignore - Restoring the function after testing
        wttpMethods.wttpGet = originalWttpGet;
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

    describe("fetch", () => {
        it("should use standard fetch for HTTP URLs", async () => {
            const url = "http://example.com";
            const response = await fetch(url);
            
            expect(response.status).to.equal(200);
            expect(await response.text()).to.equal("HTTP Response");
            expect(response.headers.get("Content-Type")).to.equal("text/plain");
        });

        it("should use WTTP fetch for WTTP URLs", async () => {
            const url = "wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/index.html";
            const response = await fetch(url);
            
            expect(response.status).to.equal(200);
            expect(response.headers.get("Content-Type")).to.equal("text/html; charset=utf-8");
            expect(response.headers.get("WTTP-Version")).to.equal(WTTP_VERSION);
            
            const text = await response.text();
            expect(text).to.include("Mock WTTP Response");
            expect(text).to.include(url);
        });

        it("should include appropriate headers in the response", async () => {
            const url = "wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/index.html";
            const response = await fetch(url);
            
            expect(response.headers.get("Content-Type")).to.equal("text/html; charset=utf-8");
            expect(response.headers.get("Content-Language")).to.equal("en");
            expect(response.headers.get("Cache-Control")).to.equal("max-age=3600, public");
            expect(response.headers.get("WTTP-Host")).to.equal("0x36C02dA8a0983159322a80FFE9F24b1acfF8B570");
            expect(response.headers.has("ETag")).to.be.true;
            expect(response.headers.has("Last-Modified")).to.be.true;
        });
    });
});