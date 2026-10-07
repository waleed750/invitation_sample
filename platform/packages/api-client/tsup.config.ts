import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  outExtension: ({format}) => ({js: format === 'cjs' ? '.cjs' : '.js'}),
  dts: true,
  sourcemap: false,
  clean: true,
  target: 'es2022',
  treeshake: true
});
