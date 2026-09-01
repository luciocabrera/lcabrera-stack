import { describe, expect, it } from 'vite-plus/test';

import { isExemptBranch } from './branch-exemption.mjs';

describe('isExemptBranch', () => {
  it('exempts the configured trunk', () => {
    expect(isExemptBranch({ branch: 'main', defaultBranch: 'main' })).toBe(
      true,
    );
    expect(isExemptBranch({ branch: 'master', defaultBranch: 'master' })).toBe(
      true,
    );
  });

  it('does not exempt `main` in a repository whose trunk is not `main`', () => {
    expect(isExemptBranch({ branch: 'main', defaultBranch: 'master' })).toBe(
      false,
    );
  });

  it('defaults to `main`, the value every gate assumed before this was configurable', () => {
    expect(isExemptBranch({ branch: 'main' })).toBe(true);
    expect(isExemptBranch({ branch: 'master' })).toBe(false);
  });

  it('exempts release branches and a detached HEAD whatever the trunk is', () => {
    expect(
      isExemptBranch({ branch: 'release-1.2', defaultBranch: 'trunk' }),
    ).toBe(true);
    expect(isExemptBranch({ branch: '', defaultBranch: 'trunk' })).toBe(true);
    expect(isExemptBranch({ branch: 'HEAD', defaultBranch: 'trunk' })).toBe(
      true,
    );
  });

  it('does not exempt a topic branch', () => {
    expect(
      isExemptBranch({ branch: 'feat/123-thing', defaultBranch: 'main' }),
    ).toBe(false);
  });
});
