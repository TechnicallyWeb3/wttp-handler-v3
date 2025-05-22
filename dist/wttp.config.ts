import { ethers } from "ethers";
// Import JSON files using dynamic import
import { Web3Site__factory } from "./src/interfaces/contracts/Web3Site__factory";
import { WTTPGatewayV3__factory } from "./src/interfaces/contracts/WTTPGatewayV3__factory";
import { WttpConfig } from "./src/interfaces/WTTPTypes";


export const WttpGatewayFactory = WTTPGatewayV3__factory;
export const Web3SiteFactory = Web3Site__factory;

export const config: WttpConfig = {
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

export default config;
