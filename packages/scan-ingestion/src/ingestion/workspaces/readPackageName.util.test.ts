import { writeTextFileWithin } from '@repo/scan-ingestion/fs/writeTextFileWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readPackageName } from './readPackageName.util.ts';

describe('readPackageName', () => {
  let directoryPath: string;

  beforeEach(() => {
    directoryPath = makeTempDirectory('scan-ingestion-pkg-name-');
  });

  afterEach(() => {
    rmSync(directoryPath, { force: true, recursive: true });
  });

  it('reads the name field', () => {
    writeTextFileWithin({
      baseDirectory: directoryPath,
      content: JSON.stringify({ name: '@lcabrera/ui' }),
      targetPath: 'package.json',
    });
    expect(readPackageName(directoryPath)).toBe('@lcabrera/ui');
  });

  it('returns undefined for missing, unparseable, or nameless files', () => {
    expect(readPackageName(directoryPath)).toBeUndefined();

    writeTextFileWithin({
      baseDirectory: directoryPath,
      content: '{not json',
      targetPath: 'package.json',
    });
    expect(readPackageName(directoryPath)).toBeUndefined();

    writeTextFileWithin({
      baseDirectory: directoryPath,
      content: JSON.stringify({ private: true }),
      targetPath: 'package.json',
    });
    expect(readPackageName(directoryPath)).toBeUndefined();
  });
});
