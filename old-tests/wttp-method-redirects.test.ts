import { expect } from "chai";
import { ethers } from "ethers";
import { WttpHandler } from "../src/index.ts.old";
import { config } from "../wttp.config.js";

/**
 * SETUP INSTRUCTIONS FOR TESTING METHOD REDIRECTS
 * 
 * These tests require a Web3Site contract deployed with specific configurations
 * for handling different HTTP methods with redirects.
 * 
 * Contract setup requirements:
 * 
 * 1. Deploy a Web3Site contract at the address specified in the tests
 *    (replace TEST_CONTRACT_ADDRESS with your actual contract address)
 * 
 * 2. Configure the following resources with different method support:
 *    - /get-only → Supports GET method only
 *    - /post-endpoint → Supports POST method
 *    - /put-endpoint → Supports PUT method
 *    - /delete-endpoint → Supports DELETE method
 *    - /all-methods → Supports all methods (GET, POST, PUT, DELETE, etc.)
 * 
 * 3. Configure the following redirects:
 *    - /redirect-301 → Returns 301 with Location: /all-methods
 *    - /redirect-302 → Returns 302 with Location: /all-methods
 *    - /redirect-303 → Returns 303 with Location: /all-methods
 *    - /redirect-307 → Returns 307 with Location: /all-methods
 *    - /redirect-308 → Returns 308 with Location: /all-methods
 * 
 * 4. Configure the endpoints to respond differently based on the HTTP method:
 *    - GET /all-methods → Returns "GET response"
 *    - POST /all-methods → Returns "POST response"
 *    - PUT /all-methods → Returns "PUT response"
 *    - DELETE /all-methods → Returns "DELETE response"
 */

describe("WTTP Method Handling with Redirects", () => {
    let handler: WttpHandler;
    // Replace with your actual contract address when testing
    const TEST_CONTRACT_ADDRESS = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";

    beforeEach(() => {
        handler = new WttpHandler({
            wttpConfig: config
        });
    });

    describe("Method Preservation in Redirects", () => {
        it("should preserve POST method in 307 Temporary Redirect", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-307`);
            const response = await handler.fetch(url, {
                method: 'POST',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            // The implementation should preserve the POST method
            expect(await response.text()).to.equal("POST response");
        });

        it("should preserve POST method in 308 Permanent Redirect", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-308`);
            const response = await handler.fetch(url, {
                method: 'POST',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            // The implementation should preserve the POST method
            expect(await response.text()).to.equal("POST response");
        });

        it("should convert POST to GET in 301 Moved Permanently", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-301`);
            const response = await handler.fetch(url, {
                method: 'POST',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            // The implementation should convert POST to GET for 301 redirects
            expect(await response.text()).to.equal("GET response");
        });

        it("should convert POST to GET in 302 Found", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-302`);
            const response = await handler.fetch(url, {
                method: 'POST',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            // The implementation should convert POST to GET for 302 redirects
            expect(await response.text()).to.equal("GET response");
        });

        it("should convert POST to GET in 303 See Other", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-303`);
            const response = await handler.fetch(url, {
                method: 'POST',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            // The implementation should convert POST to GET for 303 redirects
            expect(await response.text()).to.equal("GET response");
        });
    });

    describe("PUT Method with Redirects", () => {
        it("should preserve PUT method in 307 Temporary Redirect", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-307`);
            const response = await handler.fetch(url, {
                method: 'PUT',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            // The implementation should preserve the PUT method
            expect(await response.text()).to.equal("PUT response");
        });

        it("should preserve PUT method in 308 Permanent Redirect", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-308`);
            const response = await handler.fetch(url, {
                method: 'PUT',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            // The implementation should preserve the PUT method
            expect(await response.text()).to.equal("PUT response");
        });

        it("should convert PUT to GET in 301 Moved Permanently", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-301`);
            const response = await handler.fetch(url, {
                method: 'PUT',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            // The implementation should convert PUT to GET for 301 redirects
            expect(await response.text()).to.equal("GET response");
        });
    });

    describe("DELETE Method with Redirects", () => {
        it("should preserve DELETE method in 307 Temporary Redirect", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-307`);
            const response = await handler.fetch(url, {
                method: 'DELETE',
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            // The implementation should preserve the DELETE method
            expect(await response.text()).to.equal("DELETE response");
        });

        it("should preserve DELETE method in 308 Permanent Redirect", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-308`);
            const response = await handler.fetch(url, {
                method: 'DELETE',
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            // The implementation should preserve the DELETE method
            expect(await response.text()).to.equal("DELETE response");
        });

        it("should convert DELETE to GET in 303 See Other", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-303`);
            const response = await handler.fetch(url, {
                method: 'DELETE',
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            // The implementation should convert DELETE to GET for 303 redirects
            expect(await response.text()).to.equal("GET response");
        });
    });

    describe("Method Not Allowed Handling", () => {
        it("should handle 405 Method Not Allowed for unsupported methods", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/get-only`);
            const response = await handler.fetch(url, {
                method: 'POST',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            expect(response.status).to.equal(405);
            expect(response.headers.get("Allow")).to.include("GET");
        });

        it("should handle redirects to endpoints that don't support the method", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-307`);
            const response = await handler.fetch(url, {
                method: 'POST',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow'
            });
            
            // If the redirect target doesn't support POST, should return 405
            // This test assumes the implementation follows the redirect and then checks method support
            if (response.status === 405) {
                expect(response.headers.get("Allow")).to.not.be.null;
            } else {
                // If the implementation supports POST on the target, this should pass
                expect(response.status).to.equal(200);
            }
        });
    });

    describe("OPTIONS Method with Redirects", () => {
        it("should handle OPTIONS requests correctly", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/all-methods`);
            const response = await handler.fetch(url, {
                method: 'OPTIONS'
            });
            
            expect(response.status).to.equal(200);
            expect(response.headers.get("Allow")).to.include("GET");
            expect(response.headers.get("Allow")).to.include("POST");
            expect(response.headers.get("Allow")).to.include("PUT");
            expect(response.headers.get("Allow")).to.include("DELETE");
        });

        it("should handle OPTIONS requests with redirects", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-307`);
            const response = await handler.fetch(url, {
                method: 'OPTIONS',
                redirect: 'follow'
            });
            
            expect(response.status).to.equal(200);
            expect(response.headers.get("Allow")).to.not.be.null;
        });
    });

    describe("PATCH Method with Redirects", () => {
        it("should preserve PATCH method in 307 Temporary Redirect", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-307`);
            const response = await handler.fetch(url, {
                method: 'PATCH',
                body: JSON.stringify({ data: 'test' }),
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow'
            });
            
            // If the implementation supports PATCH, this should return 200
            // Otherwise, it might return 405 Method Not Allowed
            if (response.status === 200) {
                expect(await response.text()).to.include("PATCH");
            } else {
                expect(response.status).to.equal(405);
                expect(response.headers.get("Allow")).to.not.be.null;
            }
        });
    });

    describe("Request Body Handling in Redirects", () => {
        it("should preserve request body in 307 redirects", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-307`);
            const testData = { data: 'test-body-preservation' };
            
            // Mock the handler to check if the body is preserved
            const originalHandleWttpRequest = handler.handleWttpRequest;
            let requestBody: any = null;
            
            // @ts-ignore - accessing private method for testing
            handler.handleWttpRequest = async (url, options) => {
                const urlString = url.toString();
                if (urlString.includes("all-methods")) {
                    // This is the target of the redirect
                    // Check if the body was preserved
                    if (options.body) {
                        requestBody = options.body;
                        return new Response("Body preserved", { status: 200 });
                    } else {
                        return new Response("Body lost", { status: 200 });
                    }
                } else {
                    // This is the initial request that will redirect
                    const headers = new Headers();
                    headers.set("Location", "/all-methods");
                    return new Response(null, { status: 307, headers });
                }
            };
            
            try {
                await handler.fetch(url, {
                    method: 'POST',
                    body: JSON.stringify(testData),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    redirect: 'follow'
                });
                
                // Check if the body was preserved in the redirected request
                expect(requestBody).to.not.be.null;
                if (typeof requestBody === 'string') {
                    const parsedBody = JSON.parse(requestBody);
                    expect(parsedBody).to.deep.equal(testData);
                }
            } finally {
                // Restore original method
                handler.handleWttpRequest = originalHandleWttpRequest;
            }
        });

        it("should not include request body in GET requests after 303 redirects", async () => {
            const url = new URL(`wttp://${TEST_CONTRACT_ADDRESS}/redirect-303`);
            
            // Mock the handler to check if the body is dropped
            const originalHandleWttpRequest = handler.handleWttpRequest;
            let requestMethod: string | null = null;
            let requestBody: any = null;
            
            // @ts-ignore - accessing private method for testing
            handler.handleWttpRequest = async (url, options) => {
                const urlString = url.toString();
                if (urlString.includes("all-methods")) {
                    // This is the target of the redirect
                    requestMethod = options.method || 'GET';
                    requestBody = options.body;
                    return new Response(`Method: ${requestMethod}`, { status: 200 });
                } else {
                    // This is the initial request that will redirect
                    const headers = new Headers();
                    headers.set("Location", "/all-methods");
                    return new Response(null, { status: 303, headers });
                }
            };
            
            try {
                await handler.fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({ data: 'test' }),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    redirect: 'follow'
                });
                
                // Check that the method was changed to GET
                expect(requestMethod).to.equal('GET');
                // Check that the body was dropped
                expect(requestBody).to.be.null;
            } finally {
                // Restore original method
                handler.handleWttpRequest = originalHandleWttpRequest;
            }
        });
    });
});