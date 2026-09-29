import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {ignores: ['dist/**', 'node_modules/**']},
  // Plain JS configs are not part of the TS project.
  {files: ['**/*.js', '**/*.mjs'], extends: [tseslint.configs.disableTypeChecked]},
  {extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked]},
  {
    languageOptions: {
      parserOptions: {
        projectService: {allowDefaultProject: ['*.js', '*.mjs']},
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // The brief forbids `any` in the API; the type-checked presets already
      // ban it (`no-explicit-any`), this keeps the intent explicit.
      '@typescript-eslint/no-explicit-any': 'error',
      // Supabase errors and Nest internals are `unknown`-shaped; allow
      // deliberate `as unknown as T` narrowing but nothing looser.
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      // Nest modules/controllers are empty decorated classes by framework design.
      '@typescript-eslint/no-extraneous-class': ['error', {allowWithDecorator: true}]
    }
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off'
    }
  }
);
