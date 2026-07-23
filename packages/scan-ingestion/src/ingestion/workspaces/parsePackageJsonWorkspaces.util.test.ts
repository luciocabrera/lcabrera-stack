import { describe, expect, it } from 'vite-plus/test';

import { parsePackageJsonWorkspaces } from './parsePackageJsonWorkspaces.util.ts';

describe('parsePackageJsonWorkspaces', () => {
  it('reads the array form', () => {
    expect(
      parsePackageJsonWorkspaces({ workspaces: ['apps/*', 'packages/*'] }),
    ).toEqual(['apps/*', 'packages/*']);
  });

  it('reads the object form with a packages list', () => {
    expect(
      parsePackageJsonWorkspaces({ workspaces: { packages: ['libs/*'] } }),
    ).toEqual(['libs/*']);
  });

  it('degrades unknown shapes to []', () => {
    expect(parsePackageJsonWorkspaces({ workspaces: 'apps/*' })).toEqual([]);
    expect(parsePackageJsonWorkspaces({ name: 'no-workspaces' })).toEqual([]);
    expect(parsePackageJsonWorkspaces('not-an-object')).toEqual([]);
    expect(
      parsePackageJsonWorkspaces({ workspaces: [42, '', 'apps/*'] }),
    ).toEqual(['apps/*']);
  });
});
