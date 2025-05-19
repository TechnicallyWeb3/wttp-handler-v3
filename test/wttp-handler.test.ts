import { expect, sinon } from './test-helpers';
import { WttpHandler, WttpHandlerConfig } from '../src/index';
import { ethers } from 'ethers';

describe('WttpHandler', () => {
  // Mock config for testing
  const mockConfig: WttpHandlerConfig = {
    wttpConfig: {
      networks: {
        localhost: {
          rpcList: ['http://localhost:8545'],
          chainId: 31337,
          gateway: '0x0000000000000000000000000000000000000000',
        },
        sepolia: {
          rpcList: ['https://sepolia.infura.io/v3/your-api-key'],
          chainId: 11155111,
          gateway: '0x1111111111111111111111111111111111111111',
        },
        mainnet: {
          rpcList: ['https://mainnet.infura.io/v3/your-api-key'],
          chainId: 1,
          gateway: '0x2222222222222222222222222222222222222222',
        }
      }
    }
  };

  let handler: WttpHandler;

  beforeEach(() => {
    // Create a new handler instance before each test
    handler = new WttpHandler(mockConfig);
  });

  describe('parseWttpUrl', () => {
    it('should parse a basic WTTP URL correctly', async () => {
      // Mock the ethers.getAddress function to avoid actual validation
      sinon.stub(ethers, 'getAddress').returns('0xabc123');
      
      const result = await handler.parseWttpUrl('wttp://0xabc123/index.html');
      
      expect(result.protocol).to.equal('WTTP/3.0');
      expect(result.host).to.equal('0xabc123');
      expect(result.path).to.equal('/index.html');
      expect(result.network).to.deep.equal(mockConfig.wttpConfig.networks.localhost);
      expect(result.url).to.be.instanceOf(URL);
      expect(result.url.href).to.equal('wttp://0xabc123/index.html');
    });

    it('should parse a WTTP URL with network specified', async () => {
      // Mock the ethers.getAddress function to avoid actual validation
      sinon.stub(ethers, 'getAddress').returns('0xabc123');
      
      const result = await handler.parseWttpUrl('wttp://0xabc123:sepolia/index.html');
      
      expect(result.protocol).to.equal('WTTP/3.0');
      expect(result.host).to.equal('0xabc123');
      expect(result.path).to.equal('/index.html');
      expect(result.network).to.deep.equal(mockConfig.wttpConfig.networks.sepolia);
      expect(result.url).to.be.instanceOf(URL);
      expect(result.url.href).to.equal('wttp://0xabc123:sepolia/index.html');
    });

    it('should parse a WTTP URL with network alias', async () => {
      // Mock the ethers.getAddress function to avoid actual validation
      sinon.stub(ethers, 'getAddress').returns('0xabc123');
      
      const result = await handler.parseWttpUrl('wttp://0xabc123:1/index.html');
      
      expect(result.protocol).to.equal('WTTP/3.0');
      expect(result.host).to.equal('0xabc123');
      expect(result.path).to.equal('/index.html');
      expect(result.network).to.deep.equal(mockConfig.wttpConfig.networks.mainnet);
      expect(result.url).to.be.instanceOf(URL);
      expect(result.url.href).to.equal('wttp://0xabc123:1/index.html');
    });

    it('should throw an error for invalid WTTP URLs', async () => {
      try {
        await handler.parseWttpUrl('http://example.com');
        // If we get here, the test should fail
        expect.fail('Should have thrown an error for invalid WTTP URL');
      } catch (error) {
        expect(error).to.include('Invalid Wttp URL');
      }
    });

    it('should throw an error for invalid host', async () => {
      // Make ethers.getAddress throw an error
      sinon.stub(ethers, 'getAddress').throws(new Error('Invalid address'));
      
      try {
        await handler.parseWttpUrl('wttp://invalid-address/index.html');
        // If we get here, the test should fail
        expect.fail('Should have thrown an error for invalid host');
      } catch (error) {
        expect(error).to.include('invalid host');
      }
    });
  });

  describe('fetch', () => {
    it('should handle URL objects as input', async () => {
      // Create a spy on handleWttpRequest
      const handleWttpRequestSpy = sinon.spy(handler, 'handleWttpRequest');
      
      // Mock to prevent actual execution
      sinon.stub(handler, 'parseWttpUrl').resolves({
        protocol: 'WTTP/3.0',
        host: '0xabc123',
        path: '/index.html',
        network: mockConfig.wttpConfig.networks.localhost,
        url: new URL('wttp://0xabc123/index.html')
      });
      
      // Stub the actual request handling to avoid errors
      sinon.stub(handler, 'handleWttpRequest').resolves(new Response());
      
      const url = new URL('wttp://0xabc123/index.html');
      await handler.fetch(url);
      
      // Verify handleWttpRequest was called with the URL's href
      expect(handleWttpRequestSpy.calledOnce).to.be.true;
      expect(handleWttpRequestSpy.firstCall.args[0]).to.equal(url.href);
    });
  });
});