import { expect } from "chai";
import { ethers } from "ethers";
import { WttpHandler } from "../src/index.js";
import { config } from "../wttp.config.js";

describe("WTTP Handler", () => {
    let handler: WttpHandler;

    beforeEach(() => {
        handler = new WttpHandler({
            wttpConfig: config
        });
    });

    describe("fetch method", () => {
        it("should handle HTTP URLs by delegating to the native fetch", async () => {
            // Mock the global fetch function
            const originalFetch = global.fetch;
            const mockResponse = new Response("Test response", { status: 200 });
            
            try {
                global.fetch = async () => mockResponse;
                
                const response = await handler.fetch("http://example.com");
                
                expect(response).to.equal(mockResponse);
            } finally {
                global.fetch = originalFetch;
            }
        });

        it("should handle HTTPS URLs by delegating to the native fetch", async () => {
            // Mock the global fetch function
            const originalFetch = global.fetch;
            const mockResponse = new Response("Test response", { status: 200 });
            
            try {
                global.fetch = async () => mockResponse;
                
                const response = await handler.fetch("https://example.com");
                
                expect(response).to.equal(mockResponse);
            } finally {
                global.fetch = originalFetch;
            }
        });

        it("should return a 505 response for unsupported protocols", async () => {
            const response = await handler.fetch("ftp://example.com");
            
            expect(response.status).to.equal(505);
            expect(await response.text()).to.equal("Not Implemented");
        });

        it("should convert URL objects to strings", async () => {
            // Mock the global fetch function
            const originalFetch = global.fetch;
            const mockResponse = new Response("Test response", { status: 200 });
            
            try {
                // Create a spy to check the URL passed to fetch
                let capturedUrl: string | URL | Request = "";
                global.fetch = async (url) => {
                    capturedUrl = url;
                    return mockResponse;
                };
                
                const urlObject = new URL("https://example.com/path");
                await handler.fetch(urlObject);
                
                expect(capturedUrl).to.equal(urlObject);
            } finally {
                global.fetch = originalFetch;
            }
        });
    });

    describe("handleWttpRequest", () => {
        // These tests would require mocking the provider and contract interactions
        // For now, we'll just test the error handling
        
        it("should throw an error for invalid WTTP URLs", async () => {
            const url = new URL("wttp://invalid-address/index.html");
            
            try {
                await handler.handleWttpRequest(url, {});
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(String(error)).to.include("URL Error");
            }
        });
    });

    describe("handleIpfsRequest", () => {
        it("should throw a not implemented error", async () => {
            const url = new URL("ipfs://QmExample");
            
            try {
                await handler.handleIpfsRequest(url, {});
                expect.fail("Should have thrown an error");
            } catch (error) {
                if (error instanceof Error) {
                    expect(error.message).to.include("Not Implemented");
                } else {
                    expect(String(error)).to.include("Not Implemented");
                }
            }
        });
    });
});