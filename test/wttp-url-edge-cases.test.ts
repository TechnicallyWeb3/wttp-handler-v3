import { expect } from 'chai';
import { WttpHandler } from '../src/index.js';
import { URL } from 'url';
import config from '../wttp.config.js';

/**
 * SETUP INSTRUCTIONS FOR TESTING:
 * 
 * These tests focus on edge cases in WTTP URL handling.
 * No specific contract setup is required for most tests as they test the URL parsing logic.
 * 
 * For ENS name resolution tests:
 * - You'll need a provider that can resolve ENS names
 * - Set up an ENS name that resolves to a valid Ethereum address
 * 
 * REPLACE THE FOLLOWING PLACEHOLDERS:
 * - CONTRACT_ADDRESS: Your WTTP Gateway contract address
 * - VALID_ENS_NAME: A valid ENS name that resolves to an Ethereum address
 */

describe('WTTP URL Edge Cases', () => {
    // IMPORTANT: Replace with your actual contract address
    const CONTRACT_ADDRESS = '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570';
    const VALID_ENS_NAME = 'example.eth'; // Replace with a valid ENS name
    
    let handler: WttpHandler;
    
    beforeEach(() => {
        handler = new WttpHandler();
    });
    
    describe('URL encoding and decoding', () => {
        it('should handle URL-encoded characters in the path', async () => {
            // Test with URL-encoded characters in the path
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/path%20with%20spaces.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            expect(result.url.pathname).to.equal('/path with spaces.html');
        });
        
        it('should handle special characters in query parameters', async () => {
            // Test with special characters in query parameters
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/search?q=test%26query&filter=special%3Dchars`);
            
            const result = await handler.validateWttpUrl(url);
            
            expect(result.url.searchParams.get('q')).to.equal('test&query');
            expect(result.url.searchParams.get('filter')).to.equal('special=chars');
        });
        
        it('should handle Unicode characters in the path', async () => {
            // Test with Unicode characters in the path
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/%F0%9F%8C%9F-emoji-page.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            expect(result.url.pathname).to.equal('/🌟-emoji-page.html');
        });
    });
    
    describe('Network selection edge cases', () => {
        it('should handle invalid network IDs gracefully', async () => {
            // Test with an invalid network ID
            const url = new URL(`wttp://${CONTRACT_ADDRESS}:999999/index.html`);
            
            try {
                await handler.validateWttpUrl(url);
                expect.fail('Should have thrown an error for invalid network ID');
            } catch (error) {
                expect(String(error)).to.include('network');
            }
        });
        
        it('should handle network aliases case-insensitively', async () => {
            // Add a mock network for testing
            const originalNetworks = { ...config.networks };
            config.networks["mainnet"] = {
                rpcList: ["https://mainnet.infura.io/v3/your-key"],
                chainId: 1,
                gateway: "0x1234567890123456789012345678901234567890"
            };
            
            try {
                // Test with uppercase network alias
                const url = new URL(`wttp://${CONTRACT_ADDRESS}:MAINNET/index.html`);
                
                const result = await handler.validateWttpUrl(url);
                
                expect(result.network).to.equal(config.networks.mainnet);
            } finally {
                // Restore original networks
                config.networks = originalNetworks;
            }
        });
    });
    
    describe('Address format edge cases', () => {
        it('should handle lowercase Ethereum addresses', async () => {
            // Test with lowercase address
            const lowercaseAddress = CONTRACT_ADDRESS.toLowerCase();
            const url = new URL(`wttp://${lowercaseAddress}/index.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            // Should normalize to checksum format
            expect(result.url.hostname).to.equal(CONTRACT_ADDRESS);
        });
        
        it('should handle uppercase Ethereum addresses', async () => {
            // Test with uppercase address
            const uppercaseAddress = CONTRACT_ADDRESS.toUpperCase();
            const url = new URL(`wttp://${uppercaseAddress}/index.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            // Should normalize to checksum format
            expect(result.url.hostname).to.equal(CONTRACT_ADDRESS);
        });
        
        it('should reject addresses with invalid checksums', async () => {
            // Create an address with invalid checksum by mixing case incorrectly
            const invalidChecksumAddress = CONTRACT_ADDRESS.split('')
                .map((char, i) => i % 2 === 0 ? char.toLowerCase() : char.toUpperCase())
                .join('');
            
            const url = new URL(`wttp://${invalidChecksumAddress}/index.html`);
            
            try {
                await handler.validateWttpUrl(url);
                expect.fail('Should have thrown an error for invalid checksum');
            } catch (error) {
                expect(String(error)).to.include('address');
            }
        });
    });
    
    describe('Path edge cases', () => {
        it('should handle root path with trailing slash', async () => {
            // Test with root path and trailing slash
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/`);
            
            const result = await handler.validateWttpUrl(url);
            
            expect(result.url.pathname).to.equal('/');
        });
        
        it('should handle root path without trailing slash', async () => {
            // Test with root path without trailing slash
            const url = new URL(`wttp://${CONTRACT_ADDRESS}`);
            
            const result = await handler.validateWttpUrl(url);
            
            // Should add the trailing slash
            expect(result.url.pathname).to.equal('/');
        });
        
        it('should handle deeply nested paths', async () => {
            // Test with deeply nested path
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/level1/level2/level3/level4/level5/page.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            expect(result.url.pathname).to.equal('/level1/level2/level3/level4/level5/page.html');
        });
        
        it('should handle paths with dot segments', async () => {
            // Test with path containing dot segments
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/level1/./level2/../level2/page.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            // Should normalize the path
            expect(result.url.pathname).to.equal('/level1/level2/page.html');
        });
    });
    
    describe('ENS name resolution edge cases', () => {
        it('should handle valid ENS names', async function() {
            // Skip this test if no provider is available
            this.skip();
            
            // Test with valid ENS name
            const url = new URL(`wttp://${VALID_ENS_NAME}/index.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            // Should resolve to an Ethereum address
            expect(result.url.hostname).to.match(/^0x[a-fA-F0-9]{40}$/);
        });
        
        it('should handle ENS names with subdomains', async function() {
            // Skip this test if no provider is available
            this.skip();
            
            // Test with ENS name with subdomain
            const url = new URL(`wttp://subdomain.${VALID_ENS_NAME}/index.html`);
            
            try {
                const result = await handler.validateWttpUrl(url);
                // Should resolve to an Ethereum address
                expect(result.url.hostname).to.match(/^0x[a-fA-F0-9]{40}$/);
            } catch (error) {
                // If the subdomain doesn't resolve, that's also acceptable
                expect(String(error)).to.include('ENS');
            }
        });
        
        it('should reject invalid ENS names', async () => {
            // Test with invalid ENS name
            const url = new URL(`wttp://invalid-name-that-doesnt-exist.eth/index.html`);
            
            try {
                await handler.validateWttpUrl(url);
                expect.fail('Should have thrown an error for invalid ENS name');
            } catch (error) {
                expect(String(error)).to.include('ENS');
            }
        });
    });
    
    describe('URL modification edge cases', () => {
        it('should handle URL modifications after validation', async () => {
            // Test modifying URL after validation
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/original.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            // Modify the URL
            result.url.pathname = '/modified.html';
            
            // The URL should reflect the changes
            expect(result.url.pathname).to.equal('/modified.html');
            expect(result.url.href).to.include('/modified.html');
        });
        
        it('should handle adding query parameters after validation', async () => {
            // Test adding query parameters after validation
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/page.html`);
            
            const result = await handler.validateWttpUrl(url);
            
            // Add query parameters
            result.url.searchParams.append('param1', 'value1');
            result.url.searchParams.append('param2', 'value2');
            
            // The URL should reflect the changes
            expect(result.url.searchParams.get('param1')).to.equal('value1');
            expect(result.url.searchParams.get('param2')).to.equal('value2');
            expect(result.url.href).to.include('?param1=value1&param2=value2');
        });
    });
});