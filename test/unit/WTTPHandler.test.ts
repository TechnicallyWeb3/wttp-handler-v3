import { expect, sinon, MockProvider, MockContract, createMockHeadResponse, createMockGetResponse } from '../test-helpers';
import { WTTPHandler } from '../../src/index';

describe('WTTPHandler', () => {
  let handler: WTTPHandler;
  let mockProvider: MockProvider;
  let mockContract: MockContract;

  beforeEach(() => {
    mockProvider = new MockProvider();
    mockContract = new MockContract();
    
    // Create a handler instance with mocked dependencies
    handler = new WTTPHandler({
      provider: mockProvider as any,
      contractFactory: (address: string) => mockContract as any,
    });
  });

  describe('parseWttpUrl', () => {
    it('should parse a valid WTTP URL', () => {
      const result = (handler as any).parseWttpUrl('wttp://eth:0x1234567890123456789012345678901234567890/index.html');
      
      expect(result).to.deep.equal({
        protocol: 'wttp:',
        network: 'eth',
        host: '0x1234567890123456789012345678901234567890',
        path: '/index.html',
        url: 'wttp://eth:0x1234567890123456789012345678901234567890/index.html'
      });
    });

    it('should handle URLs with query parameters', () => {
      const result = (handler as any).parseWttpUrl('wttp://eth:0x1234567890123456789012345678901234567890/search?q=test&page=1');
      
      expect(result).to.deep.equal({
        protocol: 'wttp:',
        network: 'eth',
        host: '0x1234567890123456789012345678901234567890',
        path: '/search?q=test&page=1',
        url: 'wttp://eth:0x1234567890123456789012345678901234567890/search?q=test&page=1'
      });
    });

    it('should throw an error for invalid WTTP URLs', () => {
      expect(() => (handler as any).parseWttpUrl('http://example.com')).to.throw('Invalid WTTP URL');
    });
  });

  describe('getNetworkAlias', () => {
    it('should return the correct network alias for known networks', () => {
      expect((handler as any).getNetworkAlias('leth')).to.equal('localhost');
      expect((handler as any).getNetworkAlias('31337')).to.equal('localhost');
      expect((handler as any).getNetworkAlias('seth')).to.equal('sepolia');
      expect((handler as any).getNetworkAlias('11155111')).to.equal('sepolia');
      expect((handler as any).getNetworkAlias('eth')).to.equal('mainnet');
      expect((handler as any).getNetworkAlias('1')).to.equal('mainnet');
    });

    it('should return the input for unknown networks', () => {
      expect((handler as any).getNetworkAlias('unknown')).to.equal('unknown');
    });
  });

  describe('createHeadersFromHeadResponse', () => {
    it('should create headers from a HEAD response', () => {
      const headResponse = createMockHeadResponse();
      const headers = (handler as any).createHeadersFromHeadResponse(headResponse);
      
      expect(headers.get('Content-Type')).to.equal('text/html; charset=utf-8');
      expect(headers.get('Content-Language')).to.equal('en');
      expect(headers.get('ETag')).to.equal('0x1234567890');
      expect(headers.get('Content-Length')).to.equal('1024');
      expect(headers.get('Cache-Control')).to.equal('max-age=3600, public');
    });

    it('should handle missing optional fields', () => {
      const headResponse = createMockHeadResponse({
        charset: undefined,
        language: undefined,
        etag: undefined,
        metadata: { size: undefined, lastModified: undefined },
        headerInfo: { cache: {} }
      });
      
      const headers = (handler as any).createHeadersFromHeadResponse(headResponse);
      
      expect(headers.get('Content-Type')).to.equal('text/html');
      expect(headers.has('Content-Language')).to.be.false;
      expect(headers.has('ETag')).to.be.false;
      expect(headers.has('Content-Length')).to.be.false;
      expect(headers.has('Last-Modified')).to.be.false;
      expect(headers.has('Cache-Control')).to.be.false;
    });
  });

  describe('handleWttpRequest', () => {
    it('should handle HEAD requests', async () => {
      const mockHeadResponse = createMockHeadResponse();
      mockContract.mock('head', async () => mockHeadResponse);
      
      const request = new Request('wttp://eth:0x1234567890123456789012345678901234567890/index.html', {
        method: 'HEAD'
      });
      
      const response = await handler.handleWttpRequest(request);
      
      expect(response.status).to.equal(200);
      expect(response.headers.get('Content-Type')).to.equal('text/html; charset=utf-8');
      expect(response.headers.get('Content-Length')).to.equal('1024');
      expect(await response.text()).to.equal('');
    });

    it('should handle GET requests', async () => {
      const mockGetResponse = createMockGetResponse();
      mockContract.mock('get', async () => mockGetResponse);
      
      const request = new Request('wttp://eth:0x1234567890123456789012345678901234567890/index.html', {
        method: 'GET'
      });
      
      const response = await handler.handleWttpRequest(request);
      
      expect(response.status).to.equal(200);
      expect(response.headers.get('Content-Type')).to.equal('text/html; charset=utf-8');
      expect(response.headers.get('Content-Length')).to.equal('1024');
      expect(await response.text()).to.equal('Hello World');
    });

    it('should handle redirects', async () => {
      const mockHeadResponse = createMockHeadResponse({
        status: 301,
        headerInfo: {
          cache: {},
          location: 'wttp://eth:0x1234567890123456789012345678901234567890/new-page.html'
        }
      });
      
      mockContract.mock('head', async () => mockHeadResponse);
      
      const request = new Request('wttp://eth:0x1234567890123456789012345678901234567890/index.html', {
        method: 'HEAD',
        redirect: 'manual'
      });
      
      const response = await handler.handleWttpRequest(request);
      
      expect(response.status).to.equal(301);
      expect(response.headers.get('Location')).to.equal('wttp://eth:0x1234567890123456789012345678901234567890/new-page.html');
    });

    it('should throw an error for unsupported methods', async () => {
      const request = new Request('wttp://eth:0x1234567890123456789012345678901234567890/index.html', {
        method: 'POST'
      });
      
      try {
        await handler.handleWttpRequest(request);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Method not supported');
      }
    });
  });
});