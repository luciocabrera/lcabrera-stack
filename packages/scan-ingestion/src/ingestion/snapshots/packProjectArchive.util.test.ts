import { isExistingPathWithin } from '@repo/scan-ingestion/fs/isExistingPathWithin.util.ts';
import { readTextFileWithin } from '@repo/scan-ingestion/fs/readTextFileWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { writeTempTree } from '@repo/scan-ingestion/testing/writeTempTree.util.ts';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { extractZipArchive } from './extractZipArchive.util.ts';
import { packProjectArchive } from './packProjectArchive.util.ts';

describe('packProjectArchive', () => {
  let sourceDir: string;
  let extractDir: string;

  beforeEach(() => {
    sourceDir = makeTempDirectory('scan-ingestion-pack-src-');
    extractDir = makeTempDirectory('scan-ingestion-pack-out-');

    writeTempTree({
      baseDirectory: sourceDir,
      files: {
        '.git/HEAD': 'ref: refs/heads/main\n',
        // Ignored dirs that must never be packed.
        'node_modules/dep/index.js': 'module.exports = 1;\n',
        'README.md': '# hello\n',
        'src/index.ts': 'export const x = 1;\n',
      },
    });
  });

  afterEach(() => {
    rmSync(sourceDir, { force: true, recursive: true });
    rmSync(extractDir, { force: true, recursive: true });
  });

  it('packs source files, skips ignored dirs, and round-trips through extract', () => {
    const { archiveBytes, fileCount } = packProjectArchive({
      rootPath: sourceDir,
    });

    // node_modules + .git excluded → only README.md + src/index.ts.
    expect(fileCount).toBe(2);

    const extracted = extractZipArchive({
      archiveBytes,
      targetDirectory: extractDir,
    });
    expect(extracted.fileCount).toBe(2);

    expect(
      readTextFileWithin({
        baseDirectory: extractDir,
        targetPath: 'README.md',
      }),
    ).toBe('# hello\n');
    expect(
      readTextFileWithin({
        baseDirectory: extractDir,
        targetPath: path.join('src', 'index.ts'),
      }),
    ).toBe('export const x = 1;\n');

    expect(
      isExistingPathWithin({
        baseDirectory: extractDir,
        targetPath: 'node_modules',
      }),
    ).toBe(false);
    expect(
      isExistingPathWithin({ baseDirectory: extractDir, targetPath: '.git' }),
    ).toBe(false);
  });
});
