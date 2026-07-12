import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { strToU8, zipSync } from 'fflate';
import { existsSync, readFileSync, rmSync } from 'node:fs';
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
    expect(readFileSync(path.join(targetDirectory, 'README.md'), 'utf8')).toBe(
      '# hello\n',
    );
    expect(
      readFileSync(path.join(targetDirectory, 'src', 'index.ts'), 'utf8'),
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
    expect(existsSync(path.join(targetDirectory, 'safe.txt'))).toBe(false);
    expect(
      existsSync(path.join(path.dirname(targetDirectory), 'escape.txt')),
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
      readFileSync(
        path.join(targetDirectory, 'nested', 'deep', 'file.txt'),
        'utf8',
      ),
    ).toBe('deep');
  });
});
