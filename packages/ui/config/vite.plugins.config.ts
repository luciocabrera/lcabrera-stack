import { createReactRouterPluginsConfig } from '@lcabrera/vite-config/plugins';

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
  // The StyleX alias for @lcabrera/ui's source. It is a path into this repo's
  // layout, so the config package takes it as an option and defaults to none
  // (ADR-069) — resolved against `appRootUrl`, which sits at <workspace>/config/.
  stylexAliases: { '@lcabrera/ui/*': '../../../packages/ui/src/*' },
  // packages/ui is a component library, not a React Router app — no
  // routes.ts, no dev server, nothing for the react-router plugin or the
  // asset-manifest fixer to do. StyleX + the React Compiler babel plugin
  // still apply, same as any consuming app.
  withFixReactRouterAssetsPlugin: false,
  withReactRouterPlugin: false,
});
