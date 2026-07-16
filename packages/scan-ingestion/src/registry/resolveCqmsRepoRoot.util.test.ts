import { describe, expect, it } from 'vitest';

import { isExistingPathWithin } from '../fs/isExistingPathWithin.util.ts';
import { resolveCqmsRepoRoot } from './resolveCqmsRepoRoot.util.ts';

describe('resolveCqmsRepoRoot', () => {
  it('resolves to the monorepo root (the directory holding pnpm-workspace.yaml)', () => {
    const repoRoot = resolveCqmsRepoRoot();

    expect(
      isExistingPathWithin({
        baseDirectory: repoRoot,
        targetPath: 'pnpm-workspace.yaml',
      }),
    ).toBe(true);
    expect(
      isExistingPathWithin({
        baseDirectory: repoRoot,
        targetPath: '.github/skills',
      }),
    ).toBe(true);
  });
});
