import type { Plugin } from 'vite-plus';

import fs from 'node:fs';
import path from 'node:path';

type ManifestChunk = {
  readonly assets?: readonly string[];
  readonly file: string;
};

type ServerManifest = Record<string, ManifestChunk>;

const getServerManifestPath = (): string =>
  path.join(process.cwd(), 'build/server/.vite/manifest.json');

const readServerManifest = (): ServerManifest | undefined => {
  const serverManifestPath = getServerManifestPath();
  if (!fs.existsSync(serverManifestPath)) {
    return undefined;
  }

  return JSON.parse(
    fs.readFileSync(serverManifestPath, 'utf8'),
  ) as ServerManifest;
};

const getCssPathsFromManifest = (
  manifest: ServerManifest,
): readonly string[] => {
  const cssPaths = new Set<string>();

  for (const chunk of Object.values(manifest)) {
    if (chunk.file.endsWith('.css')) {
      cssPaths.add(chunk.file);
    }

    for (const asset of chunk.assets ?? []) {
      if (asset.endsWith('.css')) {
        cssPaths.add(asset);
      }
    }
  }

  return [...cssPaths];
};

const getClientCssFiles = ({
  clientAssetsDir,
}: {
  readonly clientAssetsDir: string;
}): readonly string[] => {
  if (!fs.existsSync(clientAssetsDir)) {
    return [];
  }

  return fs
    .readdirSync(clientAssetsDir)
    .filter((file) => file.endsWith('.css'));
};

const ensureServerCssFile = ({
  clientCssFiles,
  clientAssetsDir,
  cssPath,
  serverBuildDir,
}: {
  readonly clientAssetsDir: string;
  readonly clientCssFiles: readonly string[];
  readonly cssPath: string;
  readonly serverBuildDir: string;
}): void => {
  const serverFile = path.join(serverBuildDir, cssPath);
  if (fs.existsSync(serverFile)) {
    return;
  }

  fs.mkdirSync(path.dirname(serverFile), { recursive: true });

  if (clientCssFiles.length === 0) {
    fs.writeFileSync(serverFile, '');
    return;
  }

  const clientSource = path.join(clientAssetsDir, clientCssFiles[0]);
  fs.copyFileSync(clientSource, serverFile);
};

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
      const manifest = readServerManifest();
      if (!manifest) {
        return;
      }

      const cssPaths = getCssPathsFromManifest(manifest);

      const serverBuildDir = path.join(process.cwd(), 'build/server');
      const clientAssetsDir = path.join(process.cwd(), 'build/client/assets');
      const clientCssFiles = getClientCssFiles({ clientAssetsDir });

      for (const cssPath of cssPaths) {
        ensureServerCssFile({
          clientAssetsDir,
          clientCssFiles,
          cssPath,
          serverBuildDir,
        });
      }
    },
  };
};
