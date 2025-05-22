import { ethers } from "ethers";
import { Web3Site__factory } from "./types/interfaces/contracts/Web3Site__factory";
import { WTTPGatewayV3__factory } from "./types/interfaces/contracts/WTTPGatewayV3__factory";
import { WttpConfig } from "./types/interfaces/WTTPTypes";

export declare const WttpGatewayFactory: typeof WTTPGatewayV3__factory;
export declare const Web3SiteFactory: typeof Web3Site__factory;
export declare const config: WttpConfig;
export default config;
