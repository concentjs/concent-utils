import typescript from 'rollup-plugin-typescript';
import { terser } from 'rollup-plugin-terser';

module.exports = {
  external: ['concent'],
  input: 'src/index.ts',
  plugins: [
    typescript({
      exclude: 'node_modules/**',
      typescript: require('typescript'),
    }),
    terser(),
  ],
  output: [
    {
      format: 'umd',
      name: 'concent-utils',
      file: 'lib/concent-utils.min.js',
      globals: {
        //avoid (!) Missing global variable name
        concent: 'concent',
      }
    },
  ],
};