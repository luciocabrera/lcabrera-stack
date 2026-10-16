type BranchSelectionArgs = {
  readonly branch: string | undefined;
  readonly suite: string | undefined;
};

const BRANCH = /^[\w./-]{1,255}$/u;

export const branchSelection = ({ branch, suite }: BranchSelectionArgs) => {
  if (branch === undefined) {
    return { kind: 'pick' } as const;
  }

  return BRANCH.test(branch)
    ? ({ branch, kind: 'branch', suite } as const)
    : ({ kind: 'invalid' } as const);
};
