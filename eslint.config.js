import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import perfectionist from 'eslint-plugin-perfectionist';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import security from 'eslint-plugin-security';
import stylex from '@stylexjs/eslint-plugin';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

import { defineConfig, globalIgnores } from 'eslint/config';
import localRules from './eslint-local-rules/build/index.js';

export default defineConfig(
  // 1. Core ESLint and TypeScript Recommended
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  // Add security recommended config here (good spot: after core but before styling/sorting)
  security.configs.recommended,
  unicorn.configs.recommended,

  // 2. React Hooks and Refresh
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.recommended,
  // Other configs...
  // Enable lint rules for React
  reactX.configs['recommended-typescript'],
  // Enable lint rules for React DOM
  reactDom.configs.recommended,

  // 3. Sorting (Perfectionist)
  perfectionist.configs['recommended-natural'],

  // 4. Formatting (Prettier - Must be last to disable conflicts)
  eslintConfigPrettier,

  // 5. Custom Configuration, Plugins, and Overrides
  {
    files: ['**/*.ts', '**/*.tsx'], // Target specific files for TypeScript-aware rules
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        // Enables powerful, type-aware rules across the project
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      // Only declaring local-rules as other plugins are loaded via configs
      '@stylexjs': stylex,
      'local-rules': localRules,
    },
    rules: {
      // Conflicts: Ensure core sorting is off for perfectionist
      'sort-imports': 'off',

      // Stronger TypeScript enforcement
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: true },
      ],
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: false },
      ],
      '@typescript-eslint/no-explicit-any': 'error', // Ban any completely
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      // '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Naming convention (excellent)
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: [
            'variable',
            'classProperty',
            'objectLiteralProperty',
            'typeProperty',
            'parameter',
          ],
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will', 'was', 'are', 'does'],
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'], // Allow PascalCase for React component imports
        },
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'], // Allow PascalCase for React components
        },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],

      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
        },
      ],

      // General Rules
      'no-console': ['error', { allow: ['warn', 'error'] }], // Stricter: ban debug logs

      // Unicorn Configuration - Disable overly aggressive rules
      'unicorn/prevent-abbreviations': 'off', // Too aggressive, conflicts with common naming patterns
      'unicorn/filename-case': 'off', // Allow PascalCase for React component files
      // Disable unicorn rules that conflict with our type-first standard
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'], // Enforce type over interface
      '@typescript-eslint/no-non-null-assertion': 'warn', // Warn instead of error

      // Custom local rules
      'local-rules/destructuring-for-functions': 'warn',
      'local-rules/no-inline-type-imports': 'error',
      'local-rules/merge-duplicate-imports': 'error',
      'local-rules/type-suffix-naming': 'error',

      // StyleX validation rules
      '@stylexjs/valid-styles': 'error',
      '@stylexjs/sort-keys': 'warn',
    },
  },

  // 6. StyleX files override - Allow CSS pseudo-selectors and other CSS properties
  {
    files: ['**/*.stylex.ts'],
    rules: {
      // Disable perfectionist sorting for StyleX files - use StyleX's own sorting
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-object-types': 'off',

      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['variable', 'classProperty', 'typeProperty', 'parameter'],
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will', 'was', 'are', 'does'],
        },
        {
          selector: 'objectLiteralProperty',
          format: null, // Allow any format for object properties in StyleX files
          custom: {
            regex: '^(:|@|>|\\+|~|\\[|\\*|&|\\.|#|-|[a-z][a-zA-Z0-9]*)',
            match: true,
          },
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],
    },
  },

  // 7. Vite config override - Allow configuration object properties
  {
    files: ['vite.config.ts', 'vite.config.js'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['variable', 'classProperty', 'typeProperty', 'parameter'],
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will', 'was', 'are', 'does'],
        },
        {
          selector: 'objectLiteralProperty',
          format: null, // Allow any format for Vite config objects (like @/, unstable_moduleResolution)
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],
    },
  },

  // 8. Ignores
  globalIgnores([
    'build/',
    'out/',
    'dist/',
    'node_modules/',
    'eslint-local-rules/',
    '*.js',
    '*.mjs',
    'guidelines/playwright_config.ts',
    'scripts/',
  ]),
);
