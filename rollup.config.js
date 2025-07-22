import multiInput from 'rollup-plugin-multi-input';
import { terser } from '@rollup/plugin-terser';

export default {
  input: 'js/*.js',
  plugins: [
    multiInput(),
    terser()
  ],
  output: {
    dir: 'dist',
    format: 'iife',
    entryFileNames: '[name].min.js'
  }
};
