import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslintPluginImport from 'eslint-plugin-import';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.{js,ts}'],
    plugins: {
      js,
      unicorn: eslintPluginUnicorn,
      import: eslintPluginImport,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...eslintPluginUnicorn.configs.recommended.rules,
      'semi': ['error', 'never'],
      'quotes': ['error', 'single'],
      'no-console': 'warn',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/no-new-array': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-null': 'off',
      'import/order': ['error', {
        groups: [
          'builtin',      // Node.js standard modules
          'external',     // npm packages
          'internal',     // alias imports (if you use paths like @/utils)
          'parent',       // ../
          'sibling',      // ./
          'index',        // index.ts
          'object',       // import * as something
          'type',         // Type-only imports (TS)
        ],
        pathGroups: [
          {
            pattern: '**/*.d.ts',
            group: 'type',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always', // Enforce blank line between groups
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      }],
    },
  },
];
