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
    // Persistence boundary: only repositories (and the Supabase wiring itself)
    // may touch Supabase, so swapping the database only touches repositories.
    files: ['src/**/*.ts'],
    ignores: [
      'src/**/*.repository.ts',
      'src/supabase/**',
      'src/**/*.spec.ts',
      'src/test-helpers.ts',
      'src/jest.setup.ts',
      'src/testing/**'
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/supabase/supabase.service'],
              message: 'Only *.repository.ts files may use SupabaseService. Add a repository method instead.'
            }
          ],
          paths: [
            {name: '@supabase/supabase-js', message: 'Only src/supabase/** and *.repository.ts may import the Supabase SDK.'}
          ]
        }
      ]
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
