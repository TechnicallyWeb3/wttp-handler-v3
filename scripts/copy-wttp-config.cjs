const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Copy wttp.config.ts to dist folder
fs.copyFileSync('wttp.config.ts', 'dist/wttp.config.ts');

// Also create a JavaScript version for CJS compatibility
const configContent = fs.readFileSync('wttp.config.ts', 'utf8');
const jsContent = configContent
  .replace(/import\s+{([^}]+)}\s+from\s+["']([^"']+)["'];?/g, 'const {$1} = require("$2");')
  .replace(/export\s+const/g, 'exports.')
  .replace(/export\s+default/g, 'module.exports =')
  .replace(/export\s+{([^}]+)}/g, 'module.exports = {$1}');

fs.writeFileSync('dist/wttp.config.cjs', jsContent);

// Create a simple .d.ts file for wttp.config
const dtsContent = `import { ethers } from "ethers";
import { Web3Site__factory } from "./types/interfaces/contracts/Web3Site__factory";
import { WTTPGatewayV3__factory } from "./types/interfaces/contracts/WTTPGatewayV3__factory";
import { WttpConfig } from "./types/interfaces/WTTPTypes";

export declare const WttpGatewayFactory: typeof WTTPGatewayV3__factory;
export declare const Web3SiteFactory: typeof Web3Site__factory;
export declare const config: WttpConfig;
export default config;
`;

fs.writeFileSync('dist/wttp.config.d.ts', dtsContent);

// Copy the type definitions to the root dist folder
if (fs.existsSync('dist/types/index.d.ts')) {
  fs.copyFileSync('dist/types/index.d.ts', 'dist/index.d.ts');
}

console.log('wttp.config files and type definitions copied to dist folder');