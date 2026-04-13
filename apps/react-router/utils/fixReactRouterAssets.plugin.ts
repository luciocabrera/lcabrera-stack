import type { Plugin } from 'vite-plus';

import fs from 'node:fs';
import path from 'node:path';

/**
 * Vite 8 (Rolldown) does not emit CSS assets during SSR builds, but the
 * generated manifest still references them. The react-router plugin then
 * tries to rename those (non-existent) files from the server build to the
 * client build, causing an ENOENT error.
 *
 * This plugin runs **before** react-router's writeBundle hook and
 * pre-creates any missing CSS files in the server assets directory so the
 * rename succeeds.  Content is copied from the client build when a matching
 * CSS file exists; otherwise an empty file is created as a placeholder.
 */
export const fixReactRouterAssets = (): Plugin => {
  return {
    name: 'fix-react-router-assets',
    writeBundle() {
      const serverManifestPath = path.join(
        process.cwd(),
        'build/server/.vite/manifest.json',
      );

      if (!fs.existsSync(serverManifestPath)) return;

      const manifest = JSON.parse(
        fs.readFileSync(serverManifestPath, 'utf8'),
      ) as Record<string, { assets?: string[]; file: string }>;

      // Collect every CSS path referenced in the manifest
      // (both direct .css chunk files and assets[] entries)
      const cssPaths = new Set<string>();

      for (const chunk of Object.values(manifest)) {
        if (chunk.file.endsWith('.css')) cssPaths.add(chunk.file);
        if (chunk.assets) {
          for (const asset of chunk.assets) {
            if (asset.endsWith('.css')) cssPaths.add(asset);
          }
        }
      }

      const serverBuildDir = path.join(process.cwd(), 'build/server');
      const clientAssetsDir = path.join(process.cwd(), 'build/client/assets');

      for (const cssPath of cssPaths) {
        const serverFile = path.join(serverBuildDir, cssPath);
        if (fs.existsSync(serverFile)) continue;

        // Ensure the target directory exists
        fs.mkdirSync(path.dirname(serverFile), { recursive: true });

        // Try to copy content from the matching client CSS (any stylex-*.css)
        const clientCssFiles = fs.existsSync(clientAssetsDir)
          ? fs.readdirSync(clientAssetsDir).filter((f) => f.endsWith('.css'))
          : [];

        if (clientCssFiles.length > 0) {
          const clientSource = path.join(clientAssetsDir, clientCssFiles[0]);
          fs.copyFileSync(clientSource, serverFile);
        } else {
          fs.writeFileSync(serverFile, '');
        }
      }
    },
  };
};
