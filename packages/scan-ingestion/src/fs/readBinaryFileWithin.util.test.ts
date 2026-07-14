import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { makeTempDirectory } from '../testing/makeTempDirectory.util.ts';
import { writeTempTree } from '../testing/writeTempTree.util.ts';
import { readBinaryFileWithin } from './readBinaryFileWithin.util.ts';

describe('readBinaryFileWithin', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDirectory('scan-ingestion-bin-');
  });

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true });
  });

  it('reads file bytes verbatim (including non-utf8 bytes)', () => {
    const bytes = new Uint8Array([0, 1, 2, 254, 255]);
    writeTempTree({ baseDirectory: dir, files: { 'blob.bin': bytes } });

    expect(
      readBinaryFileWithin({ baseDirectory: dir, targetPath: 'blob.bin' }),
    ).toEqual(bytes);
  });
});
