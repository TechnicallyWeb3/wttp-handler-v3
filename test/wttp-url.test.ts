import { expect } from "chai";
import { ethers } from "ethers";
import { WttpHandler, WttpUrl } from "../src/index.js";
import { config } from "../wttp.config.js";

describe("WTTP URL Validation", () => {
    let handler: WttpHandler;

    beforeEach(() => {
        handler = new WttpHandler({
            wttpConfig: config
        });
    });

    describe("validateWttpUrl", () => {
        it("should validate a basic WTTP URL with an Ethereum address", async () => {
            const address = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
            const url = new URL(`wttp://${address}/index.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            expect(result.url.protocol).to.equal("wttp:");
            expect(result.url.hostname).to.equal(ethers.getAddress(address));
            expect(result.url.pathname).to.equal("/index.html");
            expect(result.network).to.equal(config.networks.localhost);
        });

        it("should throw an error for non-WTTP protocol", async () => {
            const url = new URL("http://example.com");
            
            try {
                await handler.validateWttpUrl(url);
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(String(error)).to.include("Invalid Wttp URL");
                expect(String(error)).to.include("invalid protocol");
            }
        });

        it("should throw an error for missing host", async () => {
            const url = new URL("wttp:///index.html");
            
            try {
                await handler.validateWttpUrl(url);
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(String(error)).to.include("Invalid WTTP URL");
                expect(String(error)).to.include("missing host");
            }
        });

        it("should throw an error for invalid Ethereum address", async () => {
            const url = new URL("wttp://invalid-address/index.html");
            
            try {
                await handler.validateWttpUrl(url);
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(String(error)).to.include("Invalid WTTP URL");
                expect(String(error)).to.include("invalid ethers address");
            }
        });

        it("should normalize the Ethereum address to checksum format", async () => {
            const address = "0x36c02da8a0983159322a80ffe9f24b1acff8b570"; // lowercase
            const checksumAddress = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570"; // checksum
            const url = new URL(`wttp://${address}/index.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            expect(result.url.hostname).to.equal(checksumAddress);
        });

        it("should set default pathname to '/' if not provided", async () => {
            const address = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
            const url = new URL(`wttp://${address}`);
            
            const result = await handler.validateWttpUrl(url);
            
            expect(result.url.pathname).to.equal("/");
        });
    });

    describe("Network selection in URL", () => {
        it("should use the default network when no port is specified", async () => {
            const address = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
            const url = new URL(`wttp://${address}/index.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            expect(result.network).to.equal(config.networks.localhost);
        });

        it("should handle network aliases in the port section", async () => {
            // Add a mock network for testing
            const originalNetworks = { ...config.networks };
            config.networks["sepolia"] = {
                rpcList: ["https://sepolia.infura.io/v3/your-key"],
                chainId: 11155111,
                gateway: "0x1234567890123456789012345678901234567890"
            };

            try {
                const address = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
                const url = new URL(`wttp://${address}:seth/index.html`);
                
                const result = await handler.validateWttpUrl(url);
                
                expect(result.network).to.equal(config.networks.sepolia);
            } finally {
                // Restore original networks
                config.networks = originalNetworks;
            }
        });

        it("should handle numeric network IDs in the port section", async () => {
            // Add a mock network for testing
            const originalNetworks = { ...config.networks };
            config.networks["mainnet"] = {
                rpcList: ["https://mainnet.infura.io/v3/your-key"],
                chainId: 1,
                gateway: "0x1234567890123456789012345678901234567890"
            };

            try {
                const address = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
                const url = new URL(`wttp://${address}:1/index.html`);
                
                const result = await handler.validateWttpUrl(url);
                
                expect(result.network).to.equal(config.networks.mainnet);
            } finally {
                // Restore original networks
                config.networks = originalNetworks;
            }
        });
    });

    describe("URL href updates", () => {
        it("should update the URL href when hostname is changed", async () => {
            const address = "0x36c02da8a0983159322a80ffe9f24b1acff8b570"; // lowercase
            const checksumAddress = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570"; // checksum
            const url = new URL(`wttp://${address}/index.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            // Check that the URL href is updated with the checksum address
            expect(result.url.href).to.equal(`wttp://${checksumAddress}/index.html`);
        });

        it("should preserve query parameters and hash in the URL", async () => {
            const address = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
            const url = new URL(`wttp://${address}/index.html?param=value#section`);
            
            const result = await handler.validateWttpUrl(url);
            
            expect(result.url.search).to.equal("?param=value");
            expect(result.url.hash).to.equal("#section");
            expect(result.url.href).to.equal(`wttp://${address}/index.html?param=value#section`);
        });
    });

    describe("Relative path handling", () => {
        it("should correctly resolve a relative path in redirects", () => {
            const baseUrl = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/page.html");
            const relativeUrl = "./resource.html";
            
            const resolvedUrl = new URL(relativeUrl, baseUrl.origin + baseUrl.pathname);
            
            expect(resolvedUrl.href).to.equal("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/resource.html");
        });

        it("should correctly resolve a parent directory relative path", () => {
            const baseUrl = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/page.html");
            const relativeUrl = "../resource.html";
            
            const resolvedUrl = new URL(relativeUrl, baseUrl.origin + baseUrl.pathname);
            
            expect(resolvedUrl.href).to.equal("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/resource.html");
        });

        it("should correctly resolve a root-relative path", () => {
            const baseUrl = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/page.html");
            const relativeUrl = "/resource.html";
            
            const resolvedUrl = new URL(relativeUrl, baseUrl.origin);
            
            expect(resolvedUrl.href).to.equal("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/resource.html");
        });
    });

    describe("ENS name resolution", () => {
        // These tests would require mocking the provider's resolveName method
        // For now, we'll just test the error handling
        
        it("should throw an error for unresolvable ENS names", async () => {
            const url = new URL("wttp://example.eth/index.html");
            
            try {
                await handler.validateWttpUrl(url);
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(String(error)).to.include("Invalid WTTP URL");
            }
        });
    });
});