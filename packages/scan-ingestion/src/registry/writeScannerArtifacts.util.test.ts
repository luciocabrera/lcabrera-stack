import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readTextFileWithin } from '../fs/readTextFileWithin.util.ts';
import { writeTextFileWithin } from '../fs/writeTextFileWithin.util.ts';
import { makeTempDirectory } from '../testing/makeTempDirectory.util.ts';
import { writeScannerArtifacts } from './writeScannerArtifacts.util.ts';

describe('writeScannerArtifacts', () => {
  let repoRoot: string;

  beforeEach(() => {
    repoRoot = makeTempDirectory('scan-ingestion-registry-');
  });

  afterEach(() => {
    rmSync(repoRoot, { force: true, recursive: true });
  });

  it('writes a runner scaffold for a deterministic scanner, never overwriting', () => {
    const first = writeScannerArtifacts({
      displayName: 'Cycle Finder',
      isDeterministic: true,
      repoRoot,
      scannerId: 'cycle-finder',
    });
    const scriptPath =
      '.github/skills/cycle-finder/scripts/generate-cycle-finder-report.mjs';

    expect(first.writtenPaths).toEqual([scriptPath]);
    expect(
      readTextFileWithin({ baseDirectory: repoRoot, targetPath: scriptPath }),
    ).toContain('TODO(parser)');

    writeTextFileWithin({
      baseDirectory: repoRoot,
      content: '// developer-owned',
      targetPath: scriptPath,
    });
    const second = writeScannerArtifacts({
      displayName: 'Cycle Finder',
      isDeterministic: true,
      repoRoot,
      scannerId: 'cycle-finder',
    });

    expect(second.writtenPaths).toEqual([]);
    expect(
      readTextFileWithin({ baseDirectory: repoRoot, targetPath: scriptPath }),
    ).toBe('// developer-owned');
  });

  it('writes SKILL.md for an LLM scanner', () => {
    const result = writeScannerArtifacts({
      description: 'Reviews naming quality.',
      displayName: 'Naming Reviewer',
      isDeterministic: false,
      repoRoot,
      scannerId: 'naming-reviewer',
    });
    const skillPath = '.github/skills/naming-reviewer/SKILL.md';

    expect(result.writtenPaths).toEqual([skillPath]);
    expect(
      readTextFileWithin({ baseDirectory: repoRoot, targetPath: skillPath }),
    ).toContain('name: naming-reviewer');
  });
});
