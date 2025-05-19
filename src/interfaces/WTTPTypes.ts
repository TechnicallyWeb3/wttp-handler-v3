import { ethers } from "ethers";

import { Web3Site } from "./contracts/Web3Site";
import { RangeStruct, WTTPGateway } from "./contracts/WTTPGateway";


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
    gateway: WTTPGateway;
    site?: Web3Site;
};

export type WttpProvider = {
    provider: ethers.JsonRpcProvider;
    signer: ethers.Signer;
    gateway: WTTPGateway;
    site: Web3Site;
};

export type HEADOptions = {
    ifModifiedSince?: bigint;
    ifNoneMatch?: string;
    signer?: ethers.Signer;
};

export type GETOptions = HEADOptions & {
    range?: RangeStruct;
};