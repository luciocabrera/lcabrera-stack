/**
 * The application's own Vite configuration. Lint and format are absent on
 * purpose: Vite+ reads those from the workspace root config only.
 *
 * The component library ships TypeScript source rather than a build, so this
 * project's own toolchain compiles it. Three settings follow from that and none
 * of them is optional — StyleX has to see the library's files to emit their
 * styles, the client bundler must not pre-bundle them past that plugin, and the
 * SSR build must not externalise a dependency Node cannot load as it is.
 */

import { createReactRouterPluginsConfig } from '@lcabrera/vite-config/plugins';
import { createReactRouterRunConfig } from '@lcabrera/vite-config/run';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';

const UI_PACKAGE = '@lcabrera/ui';

const uiSourceUrl = new URL('.', import.meta.resolve(UI_PACKAGE)).href;

export default defineConfig({
  build: {
    sourcemap: false,
  },
  optimizeDeps: {
    exclude: [UI_PACKAGE],
  },
  plugins: createReactRouterPluginsConfig({
    appRootUrl: import.meta.url,
    babelConfigOverrides: {
      parserOpts: {
        plugins: ['jsx'],
      },
      presets: [['@babel/preset-typescript', { ignoreExtensions: true }]],
    },
    babelIncludePattern: /\/src\/[^?]*\.[jt]sx?(?:$|\?)/,
    stylexAliases: { [`${UI_PACKAGE}/*`]: `${uiSourceUrl}*` },
    stylexAliasPattern: './src/*',
  }),
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: `${fileURLToPath(new URL('src', import.meta.url))}/`,
      },
    ],
  },
  run: createReactRouterRunConfig(),
  ssr: {
    noExternal: [UI_PACKAGE],
  },
});
