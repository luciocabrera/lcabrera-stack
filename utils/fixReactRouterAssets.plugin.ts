import type { Plugin } from 'vite';

import fs from 'node:fs';
import path from 'node:path';

export const fixReactRouterAssets = (): Plugin => {
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
        ) as Record<string, unknown>;
        const serverBuild = manifest['virtual:react-router/server-build'] as
          | Partial<Record<string, unknown>>
          | undefined;

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
};
