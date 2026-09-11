import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'test-results/**', 'public/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['scripts/**/*.mjs', '*.config.mjs', '*.config.ts', 'e2e/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.ts', '**/*.mjs'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
]);
