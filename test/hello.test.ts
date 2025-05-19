import { expect } from "chai";
import { hello } from "../src/hello";

describe("hello", () => {
    it("should return 'Hello, world!'", () => {
        expect(hello()).to.equal("Hello, world!");
    });
});
