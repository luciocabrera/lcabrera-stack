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
  // `($|\?)` (extension at end of string, or followed by a query string) is
  // equivalent to the previous `(\?.*)?$` but avoids the nested quantifier
  // that security/detect-unsafe-regex flags as backtracking-prone.
  babelIncludePattern: /\/src\/(?!.*\.test\.).*\.[jt]sx?($|\?)/,
  // packages/ui is a component library, not a React Router app — no
  // routes.ts, no dev server, nothing for the react-router plugin or the
  // asset-manifest fixer to do. StyleX + the React Compiler babel plugin
  // still apply, same as any consuming app.
  withFixReactRouterAssetsPlugin: false,
  withReactRouterPlugin: false,
});
