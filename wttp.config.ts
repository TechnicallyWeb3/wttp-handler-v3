import { ethers } from "ethers";
import Web3Site from "./src/interfaces/contracts/Web3Site.json";
import WttpGateway from "./src/interfaces/contracts/WTTPGatewayV3.json";

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
            gateway: "0x0000000000000000000000000000000000000000",
        }
    },
};

export default config;
