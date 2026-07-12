import { isExistingPathWithin } from '@repo/scan-ingestion/fs/isExistingPathWithin.util.ts';
import { readTextFileWithin } from '@repo/scan-ingestion/fs/readTextFileWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { strToU8, zipSync } from 'fflate';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { extractZipArchive } from './extractZipArchive.util.ts';

describe('extractZipArchive', () => {
  let targetDirectory: string;

  beforeEach(() => {
    targetDirectory = makeTempDirectory('scan-ingestion-zip-');
  });

  afterEach(() => {
    rmSync(targetDirectory, { force: true, recursive: true });
  });

  it('extracts nested files and reports file count and total bytes', () => {
    const archiveBytes = zipSync({
      'README.md': strToU8('# hello\n'),
      'src/index.ts': strToU8('export const x = 1;\n'),
    });

    const result = extractZipArchive({ archiveBytes, targetDirectory });

    expect(result.fileCount).toBe(2);
    expect(result.totalBytes).toBeGreaterThan(0);
    expect(
      readTextFileWithin({
        baseDirectory: targetDirectory,
        targetPath: 'README.md',
      }),
    ).toBe('# hello\n');
    expect(
      readTextFileWithin({
        baseDirectory: targetDirectory,
        targetPath: path.join('src', 'index.ts'),
      }),
    ).toBe('export const x = 1;\n');
  });

  it('rejects a zip-slip entry before writing anything', () => {
    const archiveBytes = zipSync({
      '../escape.txt': strToU8('gotcha'),
      'safe.txt': strToU8('safe'),
    });

    expect(() => extractZipArchive({ archiveBytes, targetDirectory })).toThrow(
      /escapes the extraction directory/,
    );
    expect(
      isExistingPathWithin({
        baseDirectory: targetDirectory,
        targetPath: 'safe.txt',
      }),
    ).toBe(false);
    expect(
      isExistingPathWithin({
        baseDirectory: path.dirname(targetDirectory),
        targetPath: 'escape.txt',
      }),
    ).toBe(false);
  });

  it('carries no bytes for directory entries and recreates dirs from file paths', () => {
    const archiveBytes = zipSync({
      'empty-dir/': new Uint8Array(),
      'nested/deep/file.txt': strToU8('deep'),
    });

    const result = extractZipArchive({ archiveBytes, targetDirectory });

    expect(result.fileCount).toBe(1);
    expect(
      readTextFileWithin({
        baseDirectory: targetDirectory,
        targetPath: path.join('nested', 'deep', 'file.txt'),
      }),
    ).toBe('deep');
  });
});
