import {FlatCompat} from '@eslint/eslintrc';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

const compat = new FlatCompat({baseDirectory: dirname(fileURLToPath(import.meta.url))});
const config = [
  {ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts']},
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {rules: {'react/no-danger': 'error', 'no-eval': 'error', 'no-new-func': 'error', 'no-implied-eval': 'error'}}
];

export default config;
