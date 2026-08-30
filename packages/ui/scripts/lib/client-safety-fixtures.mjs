/**
 * Scaffolds a throwaway pnpm workspace on disk for the client-safety guard's
 * tests: the guard answers "which package is where, and what does it publish"
 * by reading real manifests and real directories, so a fixture that is not a
 * directory tree tests something else. Shared by the guard's test files, so
 * neither grows a second copy of it.
 */

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { buildWorkspaceDirectoryIndex } from '../client-safety.mjs';

export const scaffold = (packages) => {
  const root = mkdtempSync(join(tmpdir(), 'ui-client-safety-'));
  writeFileSync(
    join(root, 'pnpm-workspace.yaml'),
    'packages:\n  - packages/*\n',
  );

  for (const {
    dependencies,
    directory,
    files,
    name,
    sources = {},
  } of packages) {
    const packageDir = join(root, 'packages', directory);
    mkdirSync(join(packageDir, 'src'), { recursive: true });
    writeFileSync(
      join(packageDir, 'package.json'),
      JSON.stringify({ dependencies, files, name }),
    );

    for (const [fileName, text] of Object.entries(sources)) {
      mkdirSync(dirname(join(packageDir, 'src', fileName)), {
        recursive: true,
      });
      writeFileSync(join(packageDir, 'src', fileName), text);
    }
  }

  return root;
};

export const CLEAN_SOURCE = 'export const one = 1;\n';
export const SERVER_ONLY_SOURCE = "import { readFileSync } from 'node:fs';\n";

export const scaffoldWithConsumer = ({ dependencies, packages, publicApi }) => {
  const root = scaffold([
    {
      directory: 'ui',
      name: '@scope/ui',
      sources: { 'public-api.ts': publicApi },
    },
    ...packages,
  ]);

  return {
    manifest: { dependencies, name: '@scope/ui' },
    publicApiFilePath: join(root, 'packages', 'ui', 'src', 'public-api.ts'),
    root,
    workspaceDirectories: buildWorkspaceDirectoryIndex(root),
  };
};
