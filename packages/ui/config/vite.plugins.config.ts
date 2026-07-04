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
  // packages/ui is a component library, not a React Router app — no
  // routes.ts, no dev server, nothing for the react-router plugin or the
  // asset-manifest fixer to do. StyleX + the React Compiler babel plugin
  // still apply, same as any consuming app.
  withFixReactRouterAssetsPlugin: false,
  withReactRouterPlugin: false,
});
