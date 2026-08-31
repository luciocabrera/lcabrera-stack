import type { Plugin } from 'vite-plus';

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

export type ReactRouterAssetsFileSystem = {
  readonly copyFileSync: (source: string, destination: string) => void;
  readonly existsSync: (target: string) => boolean;
  readonly mkdirSync: (
    directory: string,
    options: { readonly recursive: true },
  ) => unknown;
  readonly readdirSync: (directory: string) => readonly string[];
  readonly readFileSync: (target: string, encoding: 'utf8') => string;
  readonly writeFileSync: (target: string, contents: string) => void;
};

type EnsureServerCssFileArgs = {
  readonly clientAssetsDir: string;
  readonly clientCssFiles: readonly string[];
  readonly cssPath: string;
  readonly fileSystem: ReactRouterAssetsFileSystem;
  readonly serverBuildDir: string;
};

type FixReactRouterAssetsArgs = {
  readonly cwd?: string;
  readonly fileSystem?: ReactRouterAssetsFileSystem;
};

type ManifestChunk = {
  readonly assets?: readonly string[];
  readonly file: string;
};

type ReadServerManifestArgs = {
  readonly cwd: string;
  readonly fileSystem: ReactRouterAssetsFileSystem;
};

type ServerManifest = Record<string, ManifestChunk>;

const NODE_FILE_SYSTEM: ReactRouterAssetsFileSystem = {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
};

const getServerManifestPath = (cwd: string): string =>
  path.join(cwd, 'build/server/.vite/manifest.json');

const readServerManifest = ({
  cwd,
  fileSystem,
}: ReadServerManifestArgs): ServerManifest | undefined => {
  const serverManifestPath = getServerManifestPath(cwd);
  if (!fileSystem.existsSync(serverManifestPath)) {
    return undefined;
  }

  return JSON.parse(
    fileSystem.readFileSync(serverManifestPath, 'utf8'),
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

    const assets = chunk.assets ?? [];
    for (const asset of assets) {
      if (asset.endsWith('.css')) {
        cssPaths.add(asset);
      }
    }
  }

  return [...cssPaths];
};

const getClientCssFiles = ({
  clientAssetsDir,
  fileSystem,
}: {
  readonly clientAssetsDir: string;
  readonly fileSystem: ReactRouterAssetsFileSystem;
}): readonly string[] => {
  if (!fileSystem.existsSync(clientAssetsDir)) {
    return [];
  }

  return fileSystem
    .readdirSync(clientAssetsDir)
    .filter((file) => file.endsWith('.css'));
};

const ensureServerCssFile = ({
  clientAssetsDir,
  clientCssFiles,
  cssPath,
  fileSystem,
  serverBuildDir,
}: EnsureServerCssFileArgs) => {
  const serverFile = path.join(serverBuildDir, cssPath);
  if (fileSystem.existsSync(serverFile)) {
    return;
  }

  fileSystem.mkdirSync(path.dirname(serverFile), { recursive: true });

  const [firstClientCssFile] = clientCssFiles;
  if (firstClientCssFile === undefined) {
    fileSystem.writeFileSync(serverFile, '');
    return;
  }

  const clientSource = path.join(clientAssetsDir, firstClientCssFile);
  fileSystem.copyFileSync(clientSource, serverFile);
};

export const fixReactRouterAssets = ({
  cwd = process.cwd(),
  fileSystem = NODE_FILE_SYSTEM,
}: FixReactRouterAssetsArgs = {}): Plugin => {
  return {
    name: 'fix-react-router-assets',
    writeBundle() {
      const manifest = readServerManifest({ cwd, fileSystem });
      if (!manifest) {
        return;
      }

      const cssPaths = getCssPathsFromManifest(manifest);

      const serverBuildDir = path.join(cwd, 'build/server');
      const clientAssetsDir = path.join(cwd, 'build/client/assets');
      const clientCssFiles = getClientCssFiles({ clientAssetsDir, fileSystem });

      for (const cssPath of cssPaths) {
        ensureServerCssFile({
          clientAssetsDir,
          clientCssFiles,
          cssPath,
          fileSystem,
          serverBuildDir,
        });
      }
    },
  };
};
