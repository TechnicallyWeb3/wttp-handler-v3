export { formatEthereumAddress, resolveEnsName, getHostAddress, getNetworkAlias, getWttpUrl, getWttpProvider, loadWttpHost, loadWttpGateway, wttpGet, wttpHead, WTTP_VERSION } from "./utils/wttpMethods";
export type { WttpUrl, WttpConfig, WttpProvider, GETOptions, HEADOptions, WttpNetworkConfig } from "./interfaces/WTTPTypes";
export type { HEADResponseStruct, GETResponseStruct } from "./interfaces/contracts/WTTPGatewayV3";
