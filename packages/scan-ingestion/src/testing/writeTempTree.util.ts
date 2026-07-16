import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type WriteTempTreeArgs = {
  readonly baseDirectory: string;
  readonly files: Readonly<Record<string, string | Uint8Array>>;
};

/**
 * Test-only helper: writes a set of `relativePath -> content` files under a
 * temp `baseDirectory` (from makeTempDirectory), creating parent directories
 * as needed. Centralizes the on-disk fixture writes so the security-lint
 * disable lives in one place instead of every test that needs a real tree.
 */
export const writeTempTree = ({
  baseDirectory,
  files,
}: WriteTempTreeArgs): void => {
  const fileEntries = Object.entries(files);

  for (const [relativePath, content] of fileEntries) {
    const fullPath = path.join(baseDirectory, relativePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test-only fixture under a makeTempDirectory-scoped base directory
    mkdirSync(path.dirname(fullPath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test-only fixture under a makeTempDirectory-scoped base directory
    writeFileSync(fullPath, content);
  }
};
