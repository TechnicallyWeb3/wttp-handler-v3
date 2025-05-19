import { ethers } from "ethers";
// Import JSON files using dynamic import
import Web3Site from "./src/interfaces/contracts/Web3Site.json" with { type: "json" };
import WttpGateway from "./src/interfaces/contracts/WTTPGatewayV3.json" with { type: "json" };
import { WttpConfig } from "./src/interfaces/WTTPTypes";


export const WttpGatewayAbi = WttpGateway.abi;
export const Web3SiteAbi = Web3Site.abi;

export const config: WttpConfig = {
    networks: {
        localhost: {
            rpcList: ["http://localhost:8545"],
            chainId: 31337,
            gateway: "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570",
        },
        ethereum: {
            rpcList: [
                "https://ethereum-rpc.publicnode.com",
                "https://eth.llamarpc.com",
                "https://1rpc.io/eth",
                "https://eth.drpc.org",
                "https://eth.meowrpc.com"
            ],
            chainId: 1,
            gateway: "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570",
        }
    },
};

export default config;
