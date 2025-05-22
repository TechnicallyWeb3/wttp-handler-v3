import { ethers } from "ethers";

// Export utility functions from wttpMethods
export {
  formatEthereumAddress,
  resolveEnsName,
  getHostAddress,
  getNetworkAlias,
  getWttpUrl,
  getWttpProvider,
  loadWttpHost,
  loadWttpGateway,
  wttpGet,
  wttpHead,
  WTTP_VERSION
} from "./utils/wttpMethods";

// Export types and interfaces
export type {
  WttpUrl,
  WttpConfig,
  WttpProvider,
  GETOptions,
  HEADOptions,
  WttpNetworkConfig
} from "./interfaces/WTTPTypes";

// Export contract interfaces
export type {
  HEADResponseStruct,
  GETResponseStruct
} from "./interfaces/contracts/WTTPGatewayV3";

// We'll handle the wttp.config export separately in the build process