/**
 * Computes the labels for a pull request from one source of truth: `app:`/`pkg:`
 * scope labels for every workspace whose files changed (paths on stdin), plus a
 * `type:` label (and `breaking-change`) derived from the PR title (PR_TITLE env),
 * reusing the commit spec's parser. Prints them comma-separated on one line for
 * `gh pr edit --add-label`. Runs in `.github/workflows/labeler.yml`.
 *
 * Usage: git diff --name-only base..head | PR_TITLE=… node scripts/pr-labels.mjs
 * Exit codes: 0 = printed (labels are best-effort — an unparseable title just
 * contributes no type label), 1 = an unexpected error.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseCommitHeader } from './lib/commit-convention.mjs';
import { typeLabelName, workspaceLabelName } from './lib/labels.mjs';
import {
  deriveWorkspaces,
  workspacesForFiles,
} from './lib/workspace-scopes.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

const scopeLabels = (files, workspaces) =>
  workspacesForFiles(files, workspaces).map((workspace) =>
    workspaceLabelName(workspace),
  );

const titleLabels = (title) => {
  const parsed = parseCommitHeader(title);
  if (parsed === null) {
    return [];
  }
  const typeName = typeLabelName(parsed.type);
  return [
    ...(typeName === undefined ? [] : [typeName]),
    ...(parsed.breaking ? ['breaking-change'] : []),
  ];
};

const main = () => {
  const files = readFileSync(0, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const workspaces = deriveWorkspaces(REPO_ROOT);
  const labels = new Set([
    ...scopeLabels(files, workspaces),
    ...titleLabels(process.env.PR_TITLE ?? ''),
  ]);
  process.stdout.write([...labels].join(','));
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
