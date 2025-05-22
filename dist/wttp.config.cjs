const { ethers } = require("ethers");
// Import JSON files using dynamic import
const { Web3Site__factory } = require("./src/interfaces/contracts/Web3Site__factory");
const { WTTPGatewayV3__factory } = require("./src/interfaces/contracts/WTTPGatewayV3__factory");
const { WttpConfig } = require("./src/interfaces/WTTPTypes");


exports. WttpGatewayFactory = WTTPGatewayV3__factory;
exports. Web3SiteFactory = Web3Site__factory;

exports. config: WttpConfig = {
    networks: {
        localhost: {
            rpcList: ["http://localhost:8545"],
            chainId: 31337,
            gateway: "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570",
        },
        sepolia: {
            rpcList: [
                "https://ethereum-sepolia-rpc.publicnode.com",
                "https://1rpc.io/sepolia",
                "https://sepolia.drpc.org",
                "https://sepolia.meowrpc.com"
            ],
            chainId: 11155111,
            gateway: "0x8B57036c02DA8A0983159322A80FFe9F24b1aCFF",
        },
        mainnet: {
            rpcList: [
                "https://ethereum-rpc.publicnode.com",
                "https://eth.llamarpc.com",
                "https://1rpc.io/eth",
                "https://eth.drpc.org",
                "https://eth.meowrpc.com"
            ],
            chainId: 1,
            gateway: "0xa80ffe9f24B1aCFf8B57036C02DA8A0983159322",
        }
    },
};

module.exports = config;
