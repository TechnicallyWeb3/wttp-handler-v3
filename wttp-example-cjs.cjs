// CJS example
const { formatEthereumAddress, WTTP_VERSION } = require('./dist/index.cjs.js');

// Test the formatEthereumAddress function
const address = '0xa80ffe9f24B1aCFf8B57036C02DA8A0983159322';
const formattedAddress = formatEthereumAddress(address);

console.log('=== CJS Test ===');
console.log('WTTP Version:', WTTP_VERSION);
console.log('Original address:', address);
console.log('Formatted address:', formattedAddress);