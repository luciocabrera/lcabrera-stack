/**
 * Maps a browser `File.webkitRelativePath` to the repo-root-relative POSIX
 * key the server's snapshot extractor expects. `webkitRelativePath` is always
 * '/'-separated and prefixed with the picked folder's own name
 * (`my-repo/src/index.ts`), so stripping the first segment yields
 * `src/index.ts` — matching the CLI packer's `path.relative(rootPath, …)`
 * convention. That parity matters twice on the server: `extractZipArchive`'s
 * zip-slip guard resolves each key against the extraction root, and
 * `discoverProjectWorkspaces` reads `pnpm-workspace.yaml`/`package.json` at
 * that root — a folder-name prefix would nest everything one level too deep
 * and break workspace discovery. A path with no separator is returned
 * unchanged (defensive — a folder pick always yields ≥2 segments).
 */
export const resolveArchiveEntryKey = (relativePath: string) => {
  const separatorIndex = relativePath.indexOf('/');
  return separatorIndex === -1
    ? relativePath
    : relativePath.slice(separatorIndex + 1);
};
