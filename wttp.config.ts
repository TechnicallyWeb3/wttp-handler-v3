import { ethers } from "ethers";
import Web3Site from "./src/interfaces/contracts/Web3Site.json" assert { type: "json" };
import WttpGateway from "./src/interfaces/contracts/WTTPGatewayV3.json" assert { type: "json" };

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
