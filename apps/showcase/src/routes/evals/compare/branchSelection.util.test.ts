import { describe, expect, it } from 'vite-plus/test';

import { branchSelection } from './branchSelection.util';

describe('branchSelection', () => {
  it('asks for a choice when no branch is named', () => {
    expect(branchSelection({ branch: undefined, suite: undefined })).toEqual({
      kind: 'pick',
    });
  });

  it('selects a plausible branch name with its suite', () => {
    expect(branchSelection({ branch: 'feat/1-x', suite: 'skills' })).toEqual({
      branch: 'feat/1-x',
      kind: 'branch',
      suite: 'skills',
    });
  });

  it('refuses a branch name git would not produce', () => {
    expect(branchSelection({ branch: 'a b', suite: undefined })).toEqual({
      kind: 'invalid',
    });
  });
});
