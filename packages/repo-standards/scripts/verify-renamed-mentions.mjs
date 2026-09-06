#!/usr/bin/env node
/**
 * Fails the build when a change renames a file and leaves a document still
 * naming the old one.
 *
 * Why this exists alongside `docs:verify`: that gate only resolves a token that
 * is *root-anchored*, so a backticked bare filename is unchecked in every
 * document, and a rename silently invalidates each one. #604 renamed a batch of
 * modules, the sweep and a full CI run both missed the ADR that named one of
 * them, and it was found by hand afterwards (#611). Widening `docs:verify` to
 * every bare filename is not the fix — almost all of them are suffix conventions
 * and teaching examples, so it would report noise. Scoping to the names a diff
 * actually renamed away is what makes the check precise; that reasoning, and the
 * three filters it needs, live in `lib/renamed-mentions.mjs`.
 *
 * The gate runs inside `/decisions/` too, unlike the root-anchored corpus check.
 * An ADR naming a path is recording what existed when the decision was made,
 * which stays true after that path is deleted — but a name this change is
 * renaming right now cannot be in that category, and ADR-029 is the precedent:
 * the decision text was unchanged and only the pointer had rotted. A dated
 * record that does want to keep the old name says so on the line — `old.ts` (now
 * `new.ts`) — which reads better as a record and is exempt by construction.
 *
 * Usage:
 *   repo-verify-renamed-mentions              vs the remote default branch
 *   repo-verify-renamed-mentions --base <ref> vs an explicit ref
 *
 * Env:
 *   TEST_CHANGED_BASE  base ref, same variable the other diff-scoped gates read
 *
 * Exit codes: 0 = no stale mention, 1 = a document names a file this change
 * renamed away, or the base could not be resolved.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readConventions, readGates } from './config.mjs';
import { runGit } from './git-exec.mjs';
import { resolveHostRoot } from './host-root.mjs';
import { documentedFiles } from './markdown-corpus.mjs';
import {
  describeFinding,
  parseRenameDiff,
  staleMentions,
  vanishedNames,
} from './renamed-mentions.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const DEFAULT_BASE = `origin/${readConventions(REPO_ROOT).defaultBranch}`;

const git = (args) => runGit({ args, cwd: REPO_ROOT });

const parseBase = (argv, env) => {
  const at = argv.indexOf('--base');
  const explicit = at === -1 ? undefined : argv[at + 1];
  return explicit ?? env.TEST_CHANGED_BASE ?? DEFAULT_BASE;
};

class BaseRefError extends Error {}

const mergeBaseWith = (baseRef) => {
  const mergeBase = git(['merge-base', baseRef, 'HEAD']);
  if (mergeBase === undefined || mergeBase === '') {
    throw new BaseRefError(
      [
        `Rename-mention gate: cannot resolve a merge base with '${baseRef}'.`,
        '  The ref is missing or unfetched. In CI use actions/checkout with',
        `  fetch-depth: 0; locally fetch that ref — 'git fetch origin' brings`,
        '  every branch. The base is --base, else TEST_CHANGED_BASE, else',
        `  ${DEFAULT_BASE}.`,
        '  Refusing to continue: an unresolved base would check nothing.',
      ].join('\n'),
    );
  }
  return mergeBase;
};

const renamesSince = (mergeBase) => {
  const output = git([
    'diff',
    '--diff-filter=R',
    '--name-status',
    '-M',
    mergeBase,
  ]);
  if (output === undefined) {
    throw new BaseRefError(
      `Rename-mention gate: 'git diff' against '${mergeBase}' failed. Refusing to report a clean pass on no data.`,
    );
  }
  return parseRenameDiff(output);
};

const trackedPaths = () => {
  const output = git(['ls-files']);
  if (output === undefined) {
    throw new BaseRefError(
      'Rename-mention gate: could not list tracked files. Refusing to report a clean pass on no data.',
    );
  }
  return output.split('\n').filter((line) => line !== '');
};

const corpus = () =>
  documentedFiles({
    ignoredDocs: readGates(REPO_ROOT).docsPaths.ignoredDocs,
    repoRoot: REPO_ROOT,
  }).map((path) => ({
    markdown: readFileSync(join(REPO_ROOT, path), 'utf8'),
    path,
  }));

const reportFindings = (findings) => {
  console.error(
    `Rename-mention gate — ${findings.length} document reference(s) to a file this change renamed away:\n`,
  );
  for (const finding of findings) {
    console.error(`  - ${describeFinding(finding)}`);
  }
  console.error(
    '\nUpdate each mention, or delete the claim. A filename in prose is a pointer;',
  );
  console.error(
    'nothing else checks it, which is why a rename leaves it silently false.',
  );
};

const main = () => {
  const baseRef = parseBase(process.argv, process.env);
  const renames = renamesSince(mergeBaseWith(baseRef));
  const vanished = vanishedNames({ renames, trackedPaths: trackedPaths() });

  if (vanished.length === 0) {
    console.log(
      `Rename-mention gate passed: no name vanished between ${baseRef} and the working tree.`,
    );
    return;
  }

  const docs = corpus();
  const findings = staleMentions({ docs, vanished });
  if (findings.length > 0) {
    reportFindings(findings);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Rename-mention gate passed: ${docs.length} doc(s) checked for ${vanished.length} vanished name(s) vs ${baseRef}.`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
