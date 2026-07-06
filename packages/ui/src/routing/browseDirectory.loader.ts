import type { LoaderFunctionArgs } from 'react-router';

import { readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

import type { BrowseDirectoryResult } from './browseDirectory.types';

/**
 * Server-only directory listing for `PathField`'s browse modal. Deliberately
 * unscoped — this app runs locally and the projects it registers can live
 * anywhere on the machine, so there's no meaningful root to sandbox to (a
 * confirmed product decision, not an oversight).
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const requestedPath = url.searchParams.get('path')?.trim();
  const targetPath = path.resolve(requestedPath || homedir());
  const parent = path.dirname(targetPath);
  const parentPath = parent === targetPath ? undefined : parent;

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const dirents = await readdir(targetPath, { withFileTypes: true });
    const entries = dirents
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.resolve(targetPath, entry.name),
      }))
      .toSorted((a, b) => a.name.localeCompare(b.name));

    return {
      entries,
      parentPath,
      path: targetPath,
    } satisfies BrowseDirectoryResult;
  } catch {
    return {
      entries: [],
      error:
        'Could not read this directory. It may not exist, or the server may not have permission.',
      parentPath,
      path: targetPath,
    } satisfies BrowseDirectoryResult;
  }
};
