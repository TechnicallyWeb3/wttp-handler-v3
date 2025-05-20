import { expect } from "chai";
import { ethers } from "ethers";
import { config } from "../wttp.config.js";
import { 
    checkWttpGateway, 
    checkWttpHost, 
    formatEthereumAddress, 
    getGatewayAddress, 
    getHostAddress, 
    getNetworkAlias, 
    getWttpProvider, 
    getWttpUrl, 
    resolveEnsName, 
    wttpGet, 
    wttpHead 
} from "../src/utils/wttpMethods.js";
import { WttpUrl } from "../src/interfaces/WTTPTypes.js";
import { Web3Site } from "../src/interfaces/contracts/Web3Site.js";
import { WTTPGatewayV3 } from "../src/interfaces/contracts/WTTPGatewayV3.js";

describe("WTTP URL Validation", () => {

    describe("URL type validation", () => {
        it("should convert a basic WTTP URL with an Ethereum address to a URL object", async () => {
            const url = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570:1/index.html");
            
            expect(url.href).to.equal("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570:1/index.html");
            expect(url.protocol).to.equal("wttp:");
            expect(url.hostname).to.equal("0x36C02dA8a0983159322a80FFE9F24b1acfF8B570");
            expect(url.port).to.equal("1");
            expect(url.pathname).to.equal("/index.html");
            expect(new URL("./resource.html", url).href).to.equal("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570:1/resource.html");
        });
    });

    describe("wttpMethods:formatEthereumAddress", () => {
        it("should validate an Ethereum address", async () => {
            const address = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
            const result = formatEthereumAddress(address);
            
            expect(result).to.equal(address);
        });

        it("should throw an error for invalid checksum", async () => {
            const invalidAddress = "0x36c02dA8a0983159322a80FFE9F24b1acfF8B570";
            expect(() => formatEthereumAddress(invalidAddress))
                .to.throw(`Invalid Ethereum address: 0x36c02dA8a0983159322a80FFE9F24b1acfF8B570 - TypeError: bad address checksum (argument="address", value="0x36c02dA8a0983159322a80FFE9F24b1acfF8B570", code=INVALID_ARGUMENT, version=6.14.1)`);
        });

        it("should throw an error for non-Ethereum address", async () => {
            const nonEthereumAddress = "notanaddress";
            expect(() => formatEthereumAddress(nonEthereumAddress))
                .to.throw(`Invalid Ethereum address: notanaddress - TypeError: invalid address (argument="address", value="notanaddress", code=INVALID_ARGUMENT, version=6.14.1)`);
        });
    });

    describe("wttpMethods:resolveEnsName", () => {
        it("should resolve an ENS name to an Ethereum address", async () => {
            const name = "vitalik.eth";
            const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
            
            const result = await resolveEnsName(name);
            
            expect(result).to.equal(address);
        }).timeout(10000);

        it("should fail to resolve an invalid ENS name", async () => {
            const name = "invalid-9ncs232na0ais909a.eth";
            try {
                await resolveEnsName(name);
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(String(error)).to.include("Could not resolve ENS name");
            }
        });
    });

    describe("wttpMethods:getNetworkAlias", () => {
        it("should return the correct network alias", async () => {
            const result = getNetworkAlias("mainnet");
            expect(result).to.equal("mainnet");
        });

        it("should return the correct network alias for a chainId", async () => {
            const result = getNetworkAlias("1");
            expect(result).to.equal("mainnet");
        });
        it("should return itsself if invalid", async () => {
            const result = getNetworkAlias("invalid");
            expect(result).to.equal("invalid");
        });
    });

    describe("wttpMethods:getGatewayAddress", () => {
        it("should return the correct gateway address", async () => {
            const url = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570/index.html");
            const result = getGatewayAddress(url);
            expect(result).to.equal(config.networks[Object.keys(config.networks)[0]].gateway);
            const url2 = new URL("wttp://0x36C02dA8a0983159322a80FFE9F24b1acfF8B570:1/index.html");
            const result2 = getGatewayAddress(url2);
            expect(result2).to.equal(config.networks.mainnet.gateway);
        });
    });
    describe("wttpMethods:getHostAddress", () => {
        it("should return the correct host address", async () => {
            const url = new URL("wttp://0xffffffffffffffffffffffffffffffffffffffff/index.html");
            const result = await getHostAddress(url);
            expect(result).to.equal(ethers.getAddress("0xffffffffffffffffffffffffffffffffffffffff"));
        });
    });

    
    describe("wttpMethods:getWttpUrl", () => {
        it("should load a WttpUrl object with the correct values", async () => {
            const address = "0x36c02da8a0983159322a80ffe9f24b1acff8b570"; // lowercase
            const url = new URL(`wttp://${address}/index.html`);
            const result = await getWttpUrl(url);
            // Check that the URL href is updated with the checksum address
            expect(result.network).to.equal('localhost');
            expect(result.gateway).to.equal(config.networks.localhost.gateway);
            expect(result.host).to.equal(ethers.getAddress(address));
        });

        it("should correctly load a WttpUrl object from a complex URL", async () => {
            const address = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
            const url = new URL(`wttp://username:password@${address}:1/directory/index.html?param=value&param2=value2#section`);
            const result = await getWttpUrl(url);
            
            expect(result.url.protocol).to.contain("wttp");
            expect(result.url.username).to.equal("username");
            expect(result.url.password).to.equal("password");
            expect(result.url.search).to.equal("?param=value&param2=value2");
            expect(result.url.hash).to.equal("#section");
            expect(result.url.pathname).to.equal("/directory/index.html");
            expect(result.network).to.equal("mainnet");
            expect(result.gateway).to.equal(config.networks.mainnet.gateway);
            expect(result.host).to.equal(ethers.getAddress(address));
        });

        it("should throw an error if the URL is not a valid WTTP URL", async () => {
            const url = new URL("http://example.com");
            try {
                await getWttpUrl(url);
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(String(error)).to.include("URL must start with wttp://");
            }
        });

        it("should parse both ens and ethereum addresses", async () => {
            const url = new URL("wttp://vitalik.eth/index.html");
            const vitalikAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
            const result = await getWttpUrl(url);
            expect(result.host).to.equal(vitalikAddress);
        }).timeout(5000);
    });

    describe("wttpMethods:getWttpProvider", () => {
        it("should return the correct provider", async () => {
            const url = new URL("wttp://0x4c5859f0F772848b2D91F1D83E2Fe57935348029/index.html");
            const wttpUrl: WttpUrl = {
                url,
                network: "localhost",
                gateway: getGatewayAddress(url),
                host: await getHostAddress(url)
            }
            console.log(wttpUrl);
            const result = await getWttpProvider(wttpUrl);
            expect(result.gateway.target).to.equal(config.networks[Object.keys(config.networks)[0]].gateway);
            expect(result.host?.target).to.equal(url.hostname);
        });

        it("should check the host and gateway", async () => {
            const url = new URL("wttp://0x4c5859f0F772848b2D91F1D83E2Fe57935348029/index.html");
            const wttpUrl: WttpUrl = {
                url,
                network: "localhost",
                gateway: getGatewayAddress(url),
                host: url.hostname
            }
            const result = await getWttpProvider(wttpUrl);
            const validHost = await checkWttpHost(result.host as Web3Site);
            const validGateway = await checkWttpGateway(result.gateway as WTTPGatewayV3, wttpUrl.host);
            // console.log(validHost);
            // console.log(validGateway);
            expect(validHost).to.equal(true);
            expect(validGateway).to.equal(true);
        });
        
    });

    describe("wttpMethods:wttpGet", () => {
        it("should return the correct response for index.html", async () => {
            const url = new URL("wttp://0x4c5859f0F772848b2D91F1D83E2Fe57935348029/index.html");
            const result = await wttpGet(url);
            expect(result.head.responseLine.code).to.equal(200n);
            // console.log(result);
            console.log(ethers.toUtf8String(result.data));
        });

        it("should return the correct response for a directory and manually redirect", async () => {
            let url = new URL("wttp://0x4c5859f0F772848b2D91F1D83E2Fe57935348029/");
            const result = await wttpHead(url);
            expect(result.responseLine.code).to.equal(300n);
            let location = result.headerInfo.redirect.location;
            if (location.startsWith("./")) {
                location = new URL(location, url).href;
            }

            url = new URL(location);
            const wttpResult = await wttpGet(url);
            const getBody = ethers.toUtf8String(wttpResult.data);
            expect(wttpResult.head.responseLine.code).to.equal(200n);
            console.log(getBody);
        });
    });
});