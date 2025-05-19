import { ethers } from "ethers";
import {
  resolveEnsName,
  getHostAddress,
  getNetworkAlias,
  getWttpUrl,
  checkWttpHost,
  checkWttpGateway,
  wttpGet,
  wttpHead,
  WTTP_VERSION
} from "./utils/wttpMethods";

import {
  WttpConfig,
  WttpHandlerConfig,
  WttpUrl,
  WttpProvider,
  HEADOptions,
  GETOptions
} from "./interfaces/WTTPTypes";

import {
  HEADResponseStruct,
  GETResponseStruct,
  HeaderInfoStruct,
  ResponseLineStruct,
  ResourceMetadataStruct,
  CacheControlStruct,
  RedirectStruct
} from "./interfaces/contracts/WTTPGateway";

import wttpConfig from "../wttp.config";

/**
 * WttpHandler - A class for handling WTTP (Web3 HTTP) protocol requests
 * Implements a fetch-compatible API for making requests to Web3 sites
 */
export class WttpHandler {
  private config: WttpConfig;
  private signer: ethers.Signer | null;
  private staticSigner: boolean;
  private redirectCount: number = 0;
  private MAX_REDIRECTS: number = 20;

  constructor(config?: WttpHandlerConfig) {
    this.config = config?.wttpConfig || wttpConfig;
    this.staticSigner = config?.staticSigner || false;
    this.signer = config?.signer || null;
  }

  /**
   * Fetch method compatible with the standard fetch API
   * @param input URL or string to fetch
   * @param init Options for the request
   * @returns Promise<Response>
   */
  async fetch(
    input: URL | string | Request,
    init?: RequestInit
  ): Promise<Response> {
    let url: URL;
    
    if (input instanceof Request) {
      url = new URL(input.url);
      // Merge Request object with init options
      init = {
        method: input.method,
        headers: input.headers,
        body: input.body,
        mode: input.mode,
        credentials: input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer,
        integrity: input.integrity,
        ...init
      };
    } else {
      url = input instanceof URL ? input : new URL(input);
    }

    // Handle different protocols
    switch (url.protocol) {
      case 'wttp:':
        return this.handleWttpRequest(url, init || {});
      case 'http:':
      case 'https:':
        return fetch(input, init);
      default:
        return new Response("Not Implemented", { status: 505 });
    }
  }

  /**
   * Validate a WTTP URL and prepare it for processing
   * @param url The URL to validate
   * @returns Promise<WttpUrl>
   */
  async validateWttpUrl(url: URL): Promise<WttpUrl> {
    if (url.protocol !== 'wttp:') {
      throw new Error(`Invalid Wttp URL: ${url.href} - invalid protocol`);
    }

    if (!url.hostname) {
      throw new Error(`Invalid WTTP URL: ${url.href} - missing host`);
    }

    try {
      // Get signer for this request
      const signer = this.staticSigner && this.signer ? 
        this.signer : 
        ethers.Wallet.createRandom();

      // Get the WTTP URL with resolved contract addresses
      const wttpUrl = await getWttpUrl(url, signer);
      
      return wttpUrl;
    } catch (error) {
      throw new Error(`URL Error: ${url.href} - ${error}`);
    }
  }

  /**
   * Handle a WTTP protocol request
   * @param url URL to request
   * @param options Request options
   * @returns Promise<Response>
   */
  async handleWttpRequest(url: URL, options: RequestInit): Promise<Response> {
    try {
      // Validate and prepare the WTTP URL
      const wttpUrl = await this.validateWttpUrl(url);

      // Check if HTTP method is supported
      const method = (options.method || 'GET').toUpperCase();
      
      // Handle different HTTP methods
      switch (method) {
        case 'HEAD':
          return this.handleHeadRequest(wttpUrl, options);
        case 'GET':
          return this.handleGetRequest(wttpUrl, options);
        case 'POST':
        case 'PUT':
        case 'DELETE':
        case 'PATCH':
          // These methods need appropriate implementations
          // For now, we'll use GET as a fallback
          console.warn(`Method ${method} not fully implemented, using GET as fallback`);
          return this.handleGetRequest(wttpUrl, options);
        default:
          return new Response(`Method Not Allowed: ${method}`, { status: 405 });
      }
    } catch (error) {
      return new Response(`Error: ${error}`, { status: 500 });
    }
  }

  /**
   * Handle HEAD requests
   * @param wttpUrl Validated WTTP URL
   * @param options Request options
   * @returns Promise<Response>
   */
  private async handleHeadRequest(wttpUrl: WttpUrl, options: RequestInit): Promise<Response> {
    try {
      const headOptions: HEADOptions = {
        signer: this.signer || undefined,
        ifModifiedSince: options.headers && 
          'If-Modified-Since' in Object(options.headers) ? 
          BigInt(Date.parse(Object(options.headers)['If-Modified-Since']) / 1000) : 
          0n,
        ifNoneMatch: options.headers && 
          'If-None-Match' in Object(options.headers) ? 
          Object(options.headers)['If-None-Match'] : 
          ethers.ZeroHash
      };

      const response = await wttpHead(wttpUrl.url, headOptions);
      
      // Handle HTTP redirects if needed
      if (this.shouldRedirect(response.responseLine.code, options)) {
        return this.handleRedirect(wttpUrl, response, options);
      }

      return this.createResponseFromHeadResponse(response);
    } catch (error) {
      return new Response(`Error: ${error}`, { status: 500 });
    }
  }

  /**
   * Handle GET requests
   * @param wttpUrl Validated WTTP URL
   * @param options Request options
   * @returns Promise<Response>
   */
  private async handleGetRequest(wttpUrl: WttpUrl, options: RequestInit): Promise<Response> {
    try {
      const getOptions: GETOptions = {
        signer: this.signer || undefined,
        ifModifiedSince: options.headers && 
          'If-Modified-Since' in Object(options.headers) ? 
          BigInt(Date.parse(Object(options.headers)['If-Modified-Since']) / 1000) : 
          0n,
        ifNoneMatch: options.headers && 
          'If-None-Match' in Object(options.headers) ? 
          Object(options.headers)['If-None-Match'] : 
          ethers.ZeroHash,
        range: { start: 0, end: 0 } // Default range
      };

      const response = await wttpGet(wttpUrl.url, getOptions);
      
      // Handle HTTP redirects if needed
      if (this.shouldRedirect(response.head.responseLine.code, options)) {
        return this.handleRedirect(wttpUrl, response.head, options);
      }

      return this.createResponseFromGetResponse(response);
    } catch (error) {
      return new Response(`Error: ${error}`, { status: 500 });
    }
  }

  /**
   * Determine if a response should trigger a redirect
   * @param statusCode The HTTP status code
   * @param options Request options
   * @returns boolean
   */
  private shouldRedirect(statusCode: bigint, options: RequestInit): boolean {
    // Check if redirect policy allows following redirects
    const redirectPolicy = options.redirect || 'follow';
    if (redirectPolicy === 'manual' || redirectPolicy === 'error') {
      return false;
    }

    // Check if status code is a redirect code
    const code = Number(statusCode);
    return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
  }

  /**
   * Handle HTTP redirects
   * @param wttpUrl The original WTTP URL
   * @param response The HEAD response with redirect information
   * @param options The original request options
   * @returns Promise<Response>
   */
  private async handleRedirect(
    wttpUrl: WttpUrl, 
    response: HEADResponseStruct, 
    options: RequestInit
  ): Promise<Response> {
    // Prevent redirect loops
    if (++this.redirectCount > this.MAX_REDIRECTS) {
      this.redirectCount = 0;
      return new Response("Too many redirects", { status: 508 });
    }

    // Get redirect location from the response
    const location = this.getLocationFromRedirect(response);
    if (!location) {
      return this.createResponseFromHeadResponse(response);
    }

    // Resolve the redirect URL relative to the original URL
    const redirectUrl = new URL(location, wttpUrl.url);

    // For 303 redirects, always use GET method
    // For 301 and 302, use GET if the original method was POST
    const statusCode = Number(response.responseLine.code);
    if (statusCode === 303 || 
        ((statusCode === 301 || statusCode === 302) && 
         (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE'))) {
      options = {
        ...options,
        method: 'GET',
        body: undefined
      };
    }

    // Make a new request to the redirect URL
    return this.fetch(redirectUrl, options);
  }

  /**
   * Extract location header from redirect response
   * @param response The HEAD response
   * @returns string | null
   */
  private getLocationFromRedirect(response: HEADResponseStruct): string | null {
    // Implementation would need to extract Location header from the response
    // This is a placeholder since the actual structure depends on your contract format
    return "redirect-location-placeholder";
  }

  /**
   * Create a standard Response object from a HEAD response
   * @param response The HEAD response from the WTTP contract
   * @returns Response
   */
  private createResponseFromHeadResponse(response: HEADResponseStruct): Response {
    const headers = new Headers();
    
    // Process headers from the response
    // This would need to be implemented based on your contract's response format
    
    return new Response(null, {
      status: Number(response.responseLine.code),
      statusText: this.getStatusText(Number(response.responseLine.code)),
      headers
    });
  }

  /**
   * Create a standard Response object from a GET response
   * @param response The GET response from the WTTP contract
   * @returns Response
   */
  private createResponseFromGetResponse(response: GETResponseStruct): Response {
    const headers = new Headers();
    
    // Process headers from the response
    // This would need to be implemented based on your contract's response format
    
    return new Response(response.data, {
      status: Number(response.head.responseLine.code),
      statusText: this.getStatusText(Number(response.head.responseLine.code)),
      headers
    });
  }

  /**
   * Get standard HTTP status text for a status code
   * @param statusCode The HTTP status code
   * @returns string
   */
  private getStatusText(statusCode: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      301: 'Moved Permanently',
      302: 'Found',
      303: 'See Other',
      304: 'Not Modified',
      307: 'Temporary Redirect',
      308: 'Permanent Redirect',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
      505: 'HTTP Version Not Supported',
      508: 'Loop Detected'
    };
    
    return statusTexts[statusCode] || 'Unknown Status';
  }
}

// Export types and interfaces for external use
export type {
  WttpUrl,
  WttpConfig,
  WttpHandlerConfig,
  WttpProvider,
  GETOptions,
  HEADOptions
} from "./interfaces/WTTPTypes";

export {
  resolveEnsName,
  getHostAddress,
  getNetworkAlias,
  getWttpUrl,
  wttpGet,
  wttpHead,
  WTTP_VERSION
};
