import {defineConfig} from 'tsup';

// Dual build for the monorepo's two consumers:
// - `apps/web` (Next.js, ESM) keeps consuming `./src/index.ts` via the
//   `import`/`types` export conditions + `transpilePackages`.
// - `apps/api` (NestJS, CommonJS) `require`s `./dist/index.cjs`.
// Run `npm run build --workspace @platform/shared` before `build:api`.
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
