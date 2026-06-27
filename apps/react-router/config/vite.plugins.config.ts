import { createReactRouterPluginsConfig } from '@repo/vite-configs/plugins';

export const pluginsConfig = createReactRouterPluginsConfig({
  appRootUrl: import.meta.url,
  babelConfigOverrides: {
    parserOpts: {
      plugins: ['jsx'],
    },
    presets: [
      [
        '@babel/preset-typescript',
        {
          ignoreExtensions: true,
        },
      ],
    ],
  },
  babelIncludePattern: /\/src\/(?!.*\.test\.).*\.[jt]sx?(\?.*)?$/,
});
