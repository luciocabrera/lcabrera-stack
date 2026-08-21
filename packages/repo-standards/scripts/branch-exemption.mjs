/*
 * Which branches are not topic branches, and so are not subject to the naming
 * rule or to the parked-checkout rule.
 *
 * A sibling of `commit-convention.mjs` rather than a few lines inside it: two
 * exported validators there and the coordination gate all ask this same
 * question, and it is the one part of the branch rules that is a consumer's to
 * configure.
 */

/**
 * The trunk is named by the caller rather than assumed to be `main`, because
 * assuming it made these gates unusable in the repository they most needed to
 * work in. `git init` still produces `master` unless `init.defaultBranch` says
 * otherwise, so a consumer installing this package failed the branch gate on
 * their own trunk, on day one, with no name that could have passed — and the
 * coordination gate told them to `git checkout main`, to a branch that does not
 * exist.
 *
 * A detached HEAD reports as empty, and is nobody's feature branch.
 *
 * @param {{ branch: string, defaultBranch?: string }} args
 */
export const isExemptBranch = ({ branch, defaultBranch = 'main' }) =>
  branch === '' ||
  branch === defaultBranch ||
  branch === 'HEAD' ||
  branch.startsWith('release-');
