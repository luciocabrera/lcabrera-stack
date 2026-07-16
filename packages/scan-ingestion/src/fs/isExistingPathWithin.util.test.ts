import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isExistingPathWithin } from './isExistingPathWithin.util.ts';
import { writeTextFileWithin } from './writeTextFileWithin.util.ts';

describe('isExistingPathWithin', () => {
  let baseDirectory: string;

  beforeEach(() => {
    baseDirectory = makeTempDirectory('scan-ingestion-exists-within-');
  });

  afterEach(() => {
    rmSync(baseDirectory, { force: true, recursive: true });
  });

  it('reports existence for contained paths', () => {
    writeTextFileWithin({
      baseDirectory,
      content: '{}',
      targetPath: 'package.json',
    });

    expect(
      isExistingPathWithin({ baseDirectory, targetPath: 'package.json' }),
    ).toBe(true);
    expect(
      isExistingPathWithin({ baseDirectory, targetPath: 'missing.txt' }),
    ).toBe(false);
  });

  it('throws when the path escapes the base directory', () => {
    expect(() =>
      isExistingPathWithin({ baseDirectory, targetPath: '../outside' }),
    ).toThrow(/escapes trusted base directory/);
  });
});
