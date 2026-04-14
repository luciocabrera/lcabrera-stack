import { defineConfig } from 'vite-plus';
import type { OxlintConfig } from 'vite-plus/lint';

const lintConfig: OxlintConfig = {
  env: {
    builtin: true,
    es2026: true,
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['**/*.ts'],
      jsPlugins: [
        {
          name: 'local-rules',
          specifier: '../../packages/eslint-local-rules/index.js',
        },
      ],
      rules: {
        'local-rules/destructuring-for-functions': 'warn',
        'local-rules/merge-duplicate-imports': 'error',
        'local-rules/no-inline-type-imports': 'error',
        'local-rules/type-suffix-naming': 'error',
      },
    },
  ],
};

export default defineConfig({
  lint: lintConfig,
  run: {
    tasks: {
      build: {
        command: 'tsc -p tsconfig.json',
        cache: true,
      },
    },
  },
});
