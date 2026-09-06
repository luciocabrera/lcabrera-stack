/**
 * The never-baseline packages, resolved from the same authority the repository
 * names — the workspaces whose gitignore covers `eslint-suppressions.json` —
 * rather than restated as a list that would drift the moment another package
 * joins. Keying on the DIRECTORY, not the package name, keeps the invariant
 * intact across an npm scope rename. The coverage lanes themselves are
 * `gates.coverage.reportWorkspaces` and `gates.coverage.mergeWorkspaces` in
 * `devkit.config.json`, since which workspaces run coverage is the
 * repository's own data.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { readTextWithin } from './safe-read.mjs';

const WORKSPACE_ROOTS = ['packages', 'apps'];

const SUPPRESSIONS_MARKER = 'eslint-suppressions';

const ignoresSuppressions = (repoRoot, dir) => {
  try {
    return readTextWithin(join(repoRoot, dir, '.gitignore'), repoRoot).includes(
      SUPPRESSIONS_MARKER,
    );
  } catch {
    return false;
  }
};

const workspaceDirsIn = (repoRoot, root) => {
  try {
    return readdirSync(join(repoRoot, root), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${root}/${entry.name}`);
  } catch {
    return [];
  }
};

export const publicPackageDirs = (repoRoot) =>
  WORKSPACE_ROOTS.flatMap((root) => workspaceDirsIn(repoRoot, root))
    .filter((dir) => ignoresSuppressions(repoRoot, dir))
    .sort((left, right) => left.localeCompare(right));
