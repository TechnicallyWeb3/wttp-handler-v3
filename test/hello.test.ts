import { expect } from "chai";
import { hello } from "../src/hello.js";

describe("hello", () => {
    it("should return 'Hello, world!'", () => {
        expect(hello()).to.equal("Hello, world!");
    });
});
