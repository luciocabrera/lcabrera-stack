import { unzipSync } from 'fflate';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type ExtractZipArchiveResult = {
  readonly fileCount: number;
  readonly totalBytes: number;
};

type ExtractZipArchiveArgs = {
  readonly archiveBytes: Uint8Array;
  readonly targetDirectory: string;
};

/**
 * Unpacks an uploaded zip archive into `targetDirectory` (ADR-028's
 * browser sync channel). Every entry is resolved and required to stay
 * inside the target directory BEFORE anything is written — a single
 * escaping entry (zip-slip: `../../etc/cron.d/x`, absolute paths) rejects
 * the whole archive, since a partially-extracted malicious archive is
 * worse than none. Directory entries (trailing `/`) carry no bytes and
 * are recreated implicitly from file paths.
 */
export const extractZipArchive = ({
  archiveBytes,
  targetDirectory,
}: ExtractZipArchiveArgs): ExtractZipArchiveResult => {
  const entries = unzipSync(archiveBytes);
  const resolvedTarget = path.resolve(targetDirectory);

  const filePaths = Object.keys(entries).filter(
    (entryPath) => !entryPath.endsWith('/'),
  );

  const escapingEntry = filePaths.find((entryPath) => {
    const resolved = path.resolve(resolvedTarget, entryPath);
    return !resolved.startsWith(`${resolvedTarget}${path.sep}`);
  });
  if (escapingEntry !== undefined) {
    throw new Error(
      `Archive rejected: entry escapes the extraction directory: ${escapingEntry}`,
    );
  }

  for (const entryPath of filePaths) {
    const destination = path.resolve(resolvedTarget, entryPath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- destination is proven above to stay under resolvedTarget
    mkdirSync(path.dirname(destination), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- destination is proven above to stay under resolvedTarget
    writeFileSync(destination, entries[entryPath] ?? new Uint8Array());
  }

  const totalBytes = filePaths.reduce(
    (sum, entryPath) => sum + (entries[entryPath]?.length ?? 0),
    0,
  );

  return { fileCount: filePaths.length, totalBytes };
};
