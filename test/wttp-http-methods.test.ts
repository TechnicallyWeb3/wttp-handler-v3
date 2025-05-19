import { expect } from 'chai';
import { WttpHandler } from '../src/index.js';
import { URL } from 'url';

/**
 * SETUP INSTRUCTIONS FOR TESTING:
 * 
 * These tests require specific resources to be set up on your WTTP Gateway contract
 * to handle different HTTP methods and headers:
 * 
 * 1. HTTP METHODS:
 *    - Set up resource at "/methods-test" to handle different HTTP methods:
 *      - GET: Return 200 with content "GET response"
 *      - POST: Return 200 with content "POST received: [request body]"
 *      - PUT: Return 200 with content "PUT received: [request body]"
 *      - DELETE: Return 200 with content "Resource deleted"
 *      - HEAD: Return 200 with same headers as GET but no body
 *      - OPTIONS: Return 200 with Allow header listing supported methods
 *      - PATCH: Return 200 with content "PATCH received: [request body]"
 * 
 * 2. CONTENT TYPES:
 *    - Set up resource at "/content-types" to handle different content types:
 *      - When receiving "application/json", parse and return the JSON
 *      - When receiving "application/x-www-form-urlencoded", parse and return the form data
 *      - When receiving "multipart/form-data", parse and return the form data
 *      - When receiving "text/plain", return the text as-is
 * 
 * 3. RESPONSE HEADERS:
 *    - Set up resource at "/custom-headers" to return various custom headers:
 *      - Content-Type: application/json
 *      - Cache-Control: max-age=3600
 *      - X-Custom-Header: custom-value
 * 
 * 4. CONDITIONAL REQUESTS:
 *    - Set up resource at "/conditional" that supports:
 *      - If-Modified-Since header (returns 304 if not modified)
 *      - If-None-Match header (returns 304 if ETag matches)
 *      - Returns ETag and Last-Modified headers
 * 
 * 5. COMPRESSION:
 *    - Set up resource at "/compressed" that returns content with:
 *      - Content-Encoding: gzip (when Accept-Encoding includes gzip)
 *      - Content-Encoding: br (when Accept-Encoding includes br)
 *      - No encoding otherwise
 * 
 * REPLACE THE FOLLOWING PLACEHOLDERS:
 * - CONTRACT_ADDRESS: Your WTTP Gateway contract address
 */

describe('WTTP HTTP Methods and Headers', () => {
    // IMPORTANT: Replace with your actual contract address
    const CONTRACT_ADDRESS = '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570';
    
    let handler: WttpHandler;
    
    beforeEach(() => {
        handler = new WttpHandler();
    });
    
    describe('HTTP Methods', () => {
        it('should handle GET requests', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/methods-test`);
            
            const response = await handler.fetch(url);
            
            expect(response.status).to.equal(200);
            const text = await response.text();
            expect(text).to.equal('GET response');
        });
        
        it('should handle POST requests', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/methods-test`);
            const data = { test: 'data' };
            
            const response = await handler.fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            expect(response.status).to.equal(200);
            const text = await response.text();
            expect(text).to.include('POST received');
            expect(text).to.include('test');
            expect(text).to.include('data');
        });
        
        it('should handle PUT requests', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/methods-test`);
            const data = { test: 'update' };
            
            const response = await handler.fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            expect(response.status).to.equal(200);
            const text = await response.text();
            expect(text).to.include('PUT received');
            expect(text).to.include('test');
            expect(text).to.include('update');
        });
        
        it('should handle DELETE requests', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/methods-test`);
            
            const response = await handler.fetch(url, {
                method: 'DELETE'
            });
            
            expect(response.status).to.equal(200);
            const text = await response.text();
            expect(text).to.equal('Resource deleted');
        });
        
        it('should handle HEAD requests', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/methods-test`);
            
            const response = await handler.fetch(url, {
                method: 'HEAD'
            });
            
            expect(response.status).to.equal(200);
            // HEAD requests should have no body
            const text = await response.text();
            expect(text).to.equal('');
            // But should have the same headers as GET
            expect(response.headers.get('Content-Type')).to.not.be.null;
        });
        
        it('should handle OPTIONS requests', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/methods-test`);
            
            const response = await handler.fetch(url, {
                method: 'OPTIONS'
            });
            
            expect(response.status).to.equal(200);
            // Should have Allow header
            const allowHeader = response.headers.get('Allow');
            expect(allowHeader).to.not.be.null;
            expect(allowHeader).to.include('GET');
            expect(allowHeader).to.include('POST');
        });
        
        it('should handle PATCH requests', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/methods-test`);
            const data = { field: 'value' };
            
            const response = await handler.fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            expect(response.status).to.equal(200);
            const text = await response.text();
            expect(text).to.include('PATCH received');
            expect(text).to.include('field');
            expect(text).to.include('value');
        });
    });
    
    describe('Content Types', () => {
        it('should handle JSON content type', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/content-types`);
            const data = { key1: 'value1', key2: 'value2' };
            
            const response = await handler.fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            expect(response.status).to.equal(200);
            const responseData = await response.json();
            expect(responseData).to.deep.include(data);
        });
        
        it('should handle form-urlencoded content type', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/content-types`);
            const formData = new URLSearchParams();
            formData.append('field1', 'value1');
            formData.append('field2', 'value2');
            
            const response = await handler.fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            });
            
            expect(response.status).to.equal(200);
            const responseData = await response.json();
            expect(responseData.field1).to.equal('value1');
            expect(responseData.field2).to.equal('value2');
        });
        
        it('should handle text/plain content type', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/content-types`);
            const textData = 'This is plain text content';
            
            const response = await handler.fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: textData
            });
            
            expect(response.status).to.equal(200);
            const text = await response.text();
            expect(text).to.equal(textData);
        });
    });
    
    describe('Response Headers', () => {
        it('should handle custom response headers', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/custom-headers`);
            
            const response = await handler.fetch(url);
            
            expect(response.status).to.equal(200);
            expect(response.headers.get('Content-Type')).to.equal('application/json');
            expect(response.headers.get('Cache-Control')).to.equal('max-age=3600');
            expect(response.headers.get('X-Custom-Header')).to.equal('custom-value');
        });
    });
    
    describe('Conditional Requests', () => {
        it('should handle If-Modified-Since header', async () => {
            // First request to get Last-Modified header
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/conditional`);
            const firstResponse = await handler.fetch(url);
            
            expect(firstResponse.status).to.equal(200);
            const lastModified = firstResponse.headers.get('Last-Modified');
            expect(lastModified).to.not.be.null;
            
            // Second request with If-Modified-Since header
            const conditionalResponse = await handler.fetch(url, {
                headers: {
                    'If-Modified-Since': lastModified!
                }
            });
            
            // Should return 304 Not Modified
            expect(conditionalResponse.status).to.equal(304);
        });
        
        it('should handle If-None-Match header', async () => {
            // First request to get ETag header
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/conditional`);
            const firstResponse = await handler.fetch(url);
            
            expect(firstResponse.status).to.equal(200);
            const etag = firstResponse.headers.get('ETag');
            expect(etag).to.not.be.null;
            
            // Second request with If-None-Match header
            const conditionalResponse = await handler.fetch(url, {
                headers: {
                    'If-None-Match': etag!
                }
            });
            
            // Should return 304 Not Modified
            expect(conditionalResponse.status).to.equal(304);
        });
    });
    
    describe('Compression', () => {
        it('should handle gzip compression', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/compressed`);
            
            const response = await handler.fetch(url, {
                headers: {
                    'Accept-Encoding': 'gzip, deflate'
                }
            });
            
            expect(response.status).to.equal(200);
            expect(response.headers.get('Content-Encoding')).to.equal('gzip');
            // Content should be automatically decompressed by the fetch API
            const text = await response.text();
            expect(text).to.not.be.empty;
        });
        
        it('should handle brotli compression', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/compressed`);
            
            const response = await handler.fetch(url, {
                headers: {
                    'Accept-Encoding': 'br, gzip'
                }
            });
            
            expect(response.status).to.equal(200);
            expect(response.headers.get('Content-Encoding')).to.equal('br');
            // Content should be automatically decompressed by the fetch API
            const text = await response.text();
            expect(text).to.not.be.empty;
        });
    });
    
    describe('Request Timeouts', () => {
        it('should handle request timeouts', async () => {
            const url = new URL(`wttp://${CONTRACT_ADDRESS}/slow-resource`);
            
            try {
                // Set a very short timeout to force a timeout error
                await handler.fetch(url, {
                    signal: AbortSignal.timeout(10) // 10ms timeout
                });
                expect.fail('Should have timed out');
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
                expect(String(error)).to.include('abort');
            }
        });
    });
});