#!/usr/bin/env node
/**
 * Fails a change that alters a file a published package ships without a
 * changeset naming that package. `changeset status` cannot answer this: it
 * counts every file under a package directory, tests included, while a merged
 * version bump publishes exactly what the tarball holds. Background: #1472.
 *
 * Usage (from the repo root, with the base ref fetched):
 *   node scripts/verify-changesets.mjs                 vs origin/<default branch>
 *   node scripts/verify-changesets.mjs --base <ref>    vs an explicit ref
 * The base is --base, else TEST_CHANGED_BASE, else origin/<default branch>.
 *
 * Exit : 0 when every package with a shipped change is named by a changeset
 *        this change adds or edits, or is versioned by the change itself,
 *        1 when one is not, or when the base, the diff or a pack could not be read.
 */
import process from 'node:process';

import { flagValue } from '../packages/repo-standards/scripts/cli-input.mjs';
import { readConventions } from '../packages/repo-standards/scripts/config.mjs';
import { errorMessage } from '../packages/repo-standards/scripts/error-message.mjs';
import { runGit } from '../packages/repo-standards/scripts/git-exec.mjs';
import { describeMissing } from './lib/changeset-required.mjs';
import { findMissing } from './lib/changeset-sources.mjs';

const repositoryRoot = () => {
  const root = runGit({
    args: ['rev-parse', '--show-toplevel'],
    cwd: process.cwd(),
  });
  if (root === undefined || root === '') {
    throw new Error('not inside a git repository.');
  }
  return root;
};

const baseRefFor = (root) =>
  flagValue('--base') ??
  process.env.TEST_CHANGED_BASE ??
  `origin/${readConventions(root).defaultBranch}`;

const report = ({ baseRef, missing }) => {
  if (missing.length === 0) {
    console.log(
      `Changeset gate passed: every published package whose tarball this change alters since ${baseRef} is named by a changeset in it, or versioned by it.`,
    );
    return;
  }
  console.error(
    'Changeset gate failed — a published file changed with no changeset for its package:\n',
  );
  for (const entry of missing) {
    console.error(`  - ${describeMissing(entry)}`);
  }
  console.error(
    '\nAdd one with `vp run release:add`, naming each package above. A test or any file outside `files` needs none.',
  );
  process.exitCode = 1;
};

const main = async () => {
  const root = repositoryRoot();
  const baseRef = baseRefFor(root);
  report({ baseRef, missing: await findMissing({ baseRef, root }) });
};

try {
  await main();
} catch (error) {
  console.error(`Changeset gate: ${errorMessage(error)}`);
  process.exitCode = 1;
}
