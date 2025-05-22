/**
 * WTTP Fetch Module
 *
 * This module extends the standard fetch API to support WTTP protocol.
 * It allows making requests to both HTTP and WTTP resources using a unified interface.
 */
import { GETOptions, WttpHandlerConfig } from "../interfaces/WTTPTypes";
import { GETResponseStruct } from "../interfaces/contracts/WTTPGatewayV3";
/**
 * Initializes the WTTP handler with configuration
 *
 * @param config - Configuration for the WTTP handler
 */
export declare function initWttpHandler(config: WttpHandlerConfig): void;
/**
 * Mock WTTP GET function for testing
 * Returns a static result for any WTTP request
 *
 * @param url - The URL to request
 * @returns A mock WTTP response
 */
export declare function mockWttpGet(url: URL | string): Promise<GETResponseStruct>;
/**
 * Extended fetch function that supports both HTTP and WTTP protocols
 *
 * @param url - The URL to fetch
 * @param options - Fetch options, including WTTP-specific options
 * @returns A Promise that resolves to a Response object
 */
export declare function fetch(url: URL | string, options?: RequestInit & {
    wttpOptions?: GETOptions;
}): Promise<Response>;
export default fetch;
