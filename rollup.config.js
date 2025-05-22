import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.module || 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      }
    ],
    external: ['ethers'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ 
        tsconfig: './tsconfig.json',
        rootDir: './',
        declaration: true,
        declarationDir: './dist/types'
      })
    ]
  },
  // CJS build
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main || 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
        interop: 'auto'
      }
    ],
    external: ['ethers'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ 
        tsconfig: './tsconfig.json',
        rootDir: './'
      })
    ]
  }
];