export { formatEthereumAddress, resolveEnsName, getHostAddress, getNetworkAlias, getWttpUrl, getWttpProvider, loadWttpHost, loadWttpGateway, wttpGet, wttpHead, WTTP_VERSION } from "./utils/wttpMethods";
export { fetch, initWttpHandler, mockWttpGet } from "./utils/wttpFetch";
export type { WttpUrl, WttpConfig, WttpProvider, GETOptions, HEADOptions, WttpNetworkConfig, WttpHandlerConfig } from "./interfaces/WTTPTypes";
export type { HEADResponseStruct, GETResponseStruct } from "./interfaces/contracts/WTTPGatewayV3";
