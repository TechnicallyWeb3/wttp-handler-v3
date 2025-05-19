import { ethers } from "ethers";
// Import JSON files using dynamic import
import Web3SiteJson from "./src/interfaces/contracts/Web3Site.json" with { type: "json" };
import WttpGatewayJson from "./src/interfaces/contracts/WTTPGatewayV3.json" with { type: "json" };

const Web3Site = Web3SiteJson;
const WttpGateway = WttpGatewayJson;

export const WttpGatewayAbi = WttpGateway.abi;
export const Web3SiteAbi = Web3Site.abi;

export type WttpNetworkConfig = {
    rpcList: string[];
    chainId: number;
    gateway: string | ethers.Addressable;
};

export type WttpConfig = {
    networks: {
        [key: string]: WttpNetworkConfig;
    };
};

export const config: WttpConfig = {
    networks: {
        localhost: {
            rpcList: ["http://localhost:8545"],
            chainId: 31337,
            gateway: "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570",
        }
    },
};

export default config;
