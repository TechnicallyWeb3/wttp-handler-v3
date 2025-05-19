import { expect } from "chai";
import { ethers } from "ethers";
import { WttpHandler } from "../src/index.js";
import { config } from "../wttp.config.js";
import { HEADResponseStruct, RedirectStruct } from "../src/interfaces/contracts/WTTPGateway.js";

describe("WTTP Redirect Handling", () => {
    let handler: WttpHandler;

    beforeEach(() => {
        handler = new WttpHandler({
            wttpConfig: config
        });
    });

    describe("Relative path resolution in redirects", () => {
        it("should correctly resolve a relative path in redirects", () => {
            const baseUrl = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/page.html");
            const relativeUrl = "./resource.html";
            
            const resolvedUrl = new URL(relativeUrl, baseUrl);
            
            expect(resolvedUrl.href).to.equal("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/resource.html");
        });

        it("should correctly resolve a parent directory relative path", () => {
            const baseUrl = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/page.html");
            const relativeUrl = "../resource.html";
            
            const resolvedUrl = new URL(relativeUrl, baseUrl);
            
            expect(resolvedUrl.href).to.equal("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/resource.html");
        });

        it("should correctly resolve a root-relative path", () => {
            const baseUrl = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/page.html");
            const relativeUrl = "/resource.html";
            
            const resolvedUrl = new URL(relativeUrl, baseUrl);
            
            expect(resolvedUrl.href).to.equal("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/resource.html");
        });

        it("should correctly resolve a relative path with query parameters", () => {
            const baseUrl = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/page.html");
            const relativeUrl = "./resource.html?param=value";
            
            const resolvedUrl = new URL(relativeUrl, baseUrl);
            
            expect(resolvedUrl.href).to.equal("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/resource.html?param=value");
        });

        it("should correctly resolve a relative path with hash", () => {
            const baseUrl = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/page.html");
            const relativeUrl = "./resource.html#section";
            
            const resolvedUrl = new URL(relativeUrl, baseUrl);
            
            expect(resolvedUrl.href).to.equal("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/resource.html#section");
        });
    });

    describe("Absolute URL handling in redirects", () => {
        it("should handle absolute URLs in redirects", () => {
            const baseUrl = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/page.html");
            const absoluteUrl = "wttp://0x1234567890123456789012345678901234567890/other/resource.html";
            
            const resolvedUrl = new URL(absoluteUrl);
            
            expect(resolvedUrl.href).to.equal(absoluteUrl);
        });

        it("should handle protocol changes in redirects", () => {
            const baseUrl = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/path/to/page.html");
            const httpUrl = "https://example.com/resource.html";
            
            const resolvedUrl = new URL(httpUrl);
            
            expect(resolvedUrl.href).to.equal(httpUrl);
        });
    });

    describe("Multiple Choices (300) handling", () => {
        it("should default to index.html for 300 Multiple Choices without a location", () => {
            // This test would require mocking the contract response
            // For now, we'll just test the URL resolution
            
            const baseUrl = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/directory/");
            const defaultRedirect = "./index.html";
            
            const resolvedUrl = new URL(defaultRedirect, baseUrl);
            
            expect(resolvedUrl.href).to.equal("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/directory/index.html");
        });
    });
});