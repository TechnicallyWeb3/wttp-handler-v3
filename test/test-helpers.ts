import { expect } from 'chai';
import sinon from 'sinon';

// Re-export chai and sinon for convenience
export { expect, sinon };

// Mock ethers provider
export class MockProvider {
  public getNetwork() {
    return { chainId: 1n };
  }
}

// Mock contract factory
export class MockContract {
  private _functions: Record<string, Function> = {};

  constructor(public address: string = '0x1234567890123456789012345678901234567890') {}

  public mock(functionName: string, implementation: Function) {
    this._functions[functionName] = implementation;
    return this;
  }

  public connect() {
    return this;
  }

  public head = async (...args: any[]) => {
    if (this._functions.head) {
      return this._functions.head(...args);
    }
    throw new Error('head function not mocked');
  };

  public get = async (...args: any[]) => {
    if (this._functions.get) {
      return this._functions.get(...args);
    }
    throw new Error('get function not mocked');
  };
}

// Helper to create mock HEAD response
export function createMockHeadResponse(overrides: any = {}) {
  return {
    status: 200,
    contentType: 'text/html',
    charset: 'utf-8',
    language: 'en',
    etag: '0x1234567890',
    metadata: {
      size: 1024,
      lastModified: Math.floor(Date.now() / 1000),
    },
    headerInfo: {
      cache: {
        maxAge: 3600,
        noStore: false,
        noCache: false,
        immutableFlag: false,
        publicFlag: true,
      },
    },
    ...overrides
  };
}

// Helper to create mock GET response
export function createMockGetResponse(overrides: any = {}) {
  return {
    ...createMockHeadResponse(overrides),
    data: new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]), // "Hello World"
    ...overrides
  };
}

// Reset sinon after each test
afterEach(() => {
  sinon.restore();
});