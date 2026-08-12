import { zipSync } from 'fflate';
import path from 'node:path';

import { listDirectoryWithin } from '../../fs/listDirectoryWithin.util.ts';
import { readBinaryFileWithin } from '../../fs/readBinaryFileWithin.util.ts';
import { IGNORED_DIRECTORIES } from '../ingestion.constants.ts';

export type PackProjectArchiveResult = {
  readonly archiveBytes: Uint8Array;
  readonly fileCount: number;
};

type CollectEntriesArgs = {
  readonly currentPath: string;
  readonly entries: Record<string, Uint8Array>;
  readonly rootPath: string;
};

type PackProjectArchiveArgs = {
  readonly rootPath: string;
};

// Recursively fills `entries` with every file under rootPath — skipping the
// IGNORED_DIRECTORIES skip-set and any non-regular-file (symlinks included, so
// symlink loops and escapes can't happen). Keys are POSIX-normalized relative
// paths so the linux server's extractZipArchive zip-slip guard — which
// resolves each key against the target dir — matches regardless of the
// developer's OS path separator.
const collectEntries = ({
  currentPath,
  entries,
  rootPath,
}: CollectEntriesArgs): void => {
  const dirEntries = listDirectoryWithin({
    baseDirectory: rootPath,
    targetPath: currentPath,
  });

  for (const entry of dirEntries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      collectEntries({
        currentPath: path.join(currentPath, entry.name),
        entries,
        rootPath,
      });
      continue;
    }

    if (!entry.isFile()) continue;

    const fullPath = path.join(currentPath, entry.name);
    const key = path.relative(rootPath, fullPath).split(path.sep).join('/');
    entries[key] = readBinaryFileWithin({
      baseDirectory: rootPath,
      targetPath: fullPath,
    });
  }
};

/**
 * Packs a project directory into an in-memory zip (fflate) for CLI push
 * (ADR-029), honoring the shared IGNORED_DIRECTORIES skip-set so heavyweight,
 * non-source directories (node_modules, .git, build output) never bloat the
 * upload. Whole-tree only — git metadata / diff scoping is a later increment.
 */
export const packProjectArchive = ({
  rootPath,
}: PackProjectArchiveArgs): PackProjectArchiveResult => {
  const entries: Record<string, Uint8Array> = {};
  collectEntries({ currentPath: rootPath, entries, rootPath });

  return {
    archiveBytes: zipSync(entries),
    fileCount: Object.keys(entries).length,
  };
};
