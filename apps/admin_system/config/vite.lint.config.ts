import { createReactRouterLintConfig } from '@repo/vite-configs/react-router-lint';

export const lintConfig = createReactRouterLintConfig({
  ignorePatterns: ['coverage/'],
  overrides: [
    {
      files: ['src/routes/**/*.ts', 'src/routes/**/*.tsx'],
      rules: {
        'react/only-export-components': 'off',
      },
    },
  ],
});
