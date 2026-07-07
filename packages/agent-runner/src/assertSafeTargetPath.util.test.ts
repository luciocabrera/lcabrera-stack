import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { assertSafeTargetPath } from './assertSafeTargetPath.util.ts';
import { cqmsRepoRoot } from './cqmsRepoRoot.util.ts';

describe('assertSafeTargetPath', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'assert-safe-target-path-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { force: true, recursive: true });
  });

  it('accepts an absolute, existing path outside the CQMS repo', () => {
    expect(() => assertSafeTargetPath(tempDir)).not.toThrow();
  });

  it('rejects a relative path', () => {
    expect(() => assertSafeTargetPath('relative/path')).toThrow(
      /must be absolute/,
    );
  });

  it('rejects a path that does not exist', () => {
    expect(() => assertSafeTargetPath(join(tempDir, 'does-not-exist'))).toThrow(
      /does not exist/,
    );
  });

  it('accepts the CQMS repo root itself (self-scan, ADR-020)', () => {
    expect(() => assertSafeTargetPath(cqmsRepoRoot)).not.toThrow();
  });

  it('accepts a directory inside the CQMS repo', () => {
    expect(() =>
      assertSafeTargetPath(join(cqmsRepoRoot, 'packages')),
    ).not.toThrow();
  });

  it('rejects a directory that contains the CQMS repo', () => {
    expect(() => assertSafeTargetPath(join(cqmsRepoRoot, '..'))).toThrow(
      /must not contain the CQMS repo itself/,
    );
  });
});
