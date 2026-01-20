/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable security/detect-non-literal-fs-filename */
import { reactRouter } from '@react-router/dev/vite';
import stylex from '@stylexjs/unplugin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import babel from 'vite-plugin-babel';
// Workaround plugin to fix React Router's stale asset references
function fixReactRouterAssets(): Plugin {
  return {
    enforce: 'post',
    name: 'fix-react-router-assets',
    writeBundle() {
      // Read the server manifest to check for stale references
      const serverManifestPath = path.join(
        process.cwd(),
        'build/server/.vite/manifest.json',
      );

      if (fs.existsSync(serverManifestPath)) {
        const manifest = JSON.parse(
          fs.readFileSync(serverManifestPath, 'utf8'),
        );
        const serverBuild = manifest['virtual:react-router/server-build'];

        if (serverBuild?.assets) {
          // Get actual generated CSS files
          const serverAssetsDir = path.join(
            process.cwd(),
            'build/server/assets',
          );
          const actualFiles = fs.existsSync(serverAssetsDir)
            ? fs.readdirSync(serverAssetsDir)
            : [];
          const actualStylexCss = actualFiles.find((f) =>
            f.startsWith('stylex-'),
          );

          // Update the manifest with correct asset reference
          if (actualStylexCss) {
            serverBuild.assets = [`assets/${actualStylexCss}`];
            fs.writeFileSync(
              serverManifestPath,
              JSON.stringify(manifest, null, 2),
            );
          }
        }
      }
    },
  };
}
export default defineConfig({
  plugins: [
    stylex.vite({
      aliases: {
        '@/*': [fileURLToPath(new URL('src/*', import.meta.url))],
      },
      dev: process.env.NODE_ENV === 'development',
      useCSSLayers: true,
    }),
    fixReactRouterAssets(),
    reactRouter(),
    babel({
      babelConfig: {
        plugins: [['babel-plugin-react-compiler']],
        presets: ['@babel/preset-typescript'],
      },
      filter: /\.[jt]sx?$/,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://localhost:3001',
      },
    },
  },
});
