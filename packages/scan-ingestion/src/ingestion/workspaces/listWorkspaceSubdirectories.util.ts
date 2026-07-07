import { listDirectoryWithin } from '../../fs/listDirectoryWithin.util.ts';

type ListWorkspaceSubdirectoriesArgs = {
  readonly relativePath: string;
  readonly rootPath: string;
};

/**
 * Names of the subdirectories of `rootPath`/`relativePath` — the candidate
 * pool a `*` glob segment expands over (ADR-021). node_modules is never a
 * workspace; a missing/unreadable directory degrades to [] (best-effort
 * discovery). Containment-checked via listDirectoryWithin.
 */
export const listWorkspaceSubdirectories = ({
  relativePath,
  rootPath,
}: ListWorkspaceSubdirectoriesArgs): readonly string[] => {
  try {
    return listDirectoryWithin({
      baseDirectory: rootPath,
      targetPath: relativePath === '' ? '.' : relativePath,
    })
      .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
      .map((entry) => entry.name);
  } catch {
    return [];
  }
};
