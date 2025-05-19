import { expect } from '../test-helpers';
import { WTTPUrl } from '../../src/index';

describe('WTTPUrl', () => {
  describe('constructor', () => {
    it('should parse a valid WTTP URL', () => {
      const url = new WTTPUrl('wttp://eth:0x1234567890123456789012345678901234567890/index.html');
      
      expect(url.protocol).to.equal('wttp:');
      expect(url.network).to.equal('eth');
      expect(url.host).to.equal('0x1234567890123456789012345678901234567890');
      expect(url.pathname).to.equal('/index.html');
      expect(url.href).to.equal('wttp://eth:0x1234567890123456789012345678901234567890/index.html');
    });

    it('should handle URLs with query parameters', () => {
      const url = new WTTPUrl('wttp://eth:0x1234567890123456789012345678901234567890/search?q=test&page=1');
      
      expect(url.protocol).to.equal('wttp:');
      expect(url.network).to.equal('eth');
      expect(url.host).to.equal('0x1234567890123456789012345678901234567890');
      expect(url.pathname).to.equal('/search');
      expect(url.search).to.equal('?q=test&page=1');
      expect(url.href).to.equal('wttp://eth:0x1234567890123456789012345678901234567890/search?q=test&page=1');
    });

    it('should handle URLs with hash fragments', () => {
      const url = new WTTPUrl('wttp://eth:0x1234567890123456789012345678901234567890/page.html#section1');
      
      expect(url.protocol).to.equal('wttp:');
      expect(url.network).to.equal('eth');
      expect(url.host).to.equal('0x1234567890123456789012345678901234567890');
      expect(url.pathname).to.equal('/page.html');
      expect(url.hash).to.equal('#section1');
      expect(url.href).to.equal('wttp://eth:0x1234567890123456789012345678901234567890/page.html#section1');
    });

    it('should throw an error for invalid WTTP URLs', () => {
      expect(() => new WTTPUrl('http://example.com')).to.throw('Invalid WTTP URL');
    });
  });

  describe('toString', () => {
    it('should return the full URL string', () => {
      const url = new WTTPUrl('wttp://eth:0x1234567890123456789012345678901234567890/index.html');
      expect(url.toString()).to.equal('wttp://eth:0x1234567890123456789012345678901234567890/index.html');
    });
  });

  describe('toJSON', () => {
    it('should return the full URL string', () => {
      const url = new WTTPUrl('wttp://eth:0x1234567890123456789012345678901234567890/index.html');
      expect(url.toJSON()).to.equal('wttp://eth:0x1234567890123456789012345678901234567890/index.html');
    });
  });
});