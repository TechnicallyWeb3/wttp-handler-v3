import { ethers } from "ethers";
import { Web3Site } from "./contracts/Web3Site";
import { RangeStruct, WTTPGatewayV3 } from "./contracts/WTTPGatewayV3";
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
export type WttpHandlerConfig = {
    wttpConfig: WttpConfig;
    staticSigner?: boolean;
    signer?: ethers.Signer;
};
export type WttpUrl = {
    url: URL;
    network: string;
    gateway: string;
    host: string;
};
export type WttpProvider = {
    gateway: WTTPGatewayV3;
    host?: Web3Site;
};
export type HEADOptions = {
    ifModifiedSince?: bigint;
    ifNoneMatch?: string;
    signer?: ethers.Signer;
};
export type GETOptions = HEADOptions & {
    range?: RangeStruct;
};
