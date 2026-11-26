#!/usr/bin/env node
/**
 * Prints, as step-output lines, which skills a pull request's eval report
 * selects and whether it runs them: `scope` is out, none, some or all,
 * `skills` names the some, and `run` is true only when the pull request
 * carries the opt-in label.
 * Usage (from the repo root): node evals/pr-report/select-skills.mjs --base <ref>
 *   (HEAD or a ref name `git for-each-ref` lists; anything else is refused)
 *   [--labels <JSON array of the pull request's label names>]
 * Exit codes: 0 = printed, 1 = the base cannot be resolved.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { runGit } from '../../packages/repo-standards/scripts/git-exec.mjs';
import {
  catalogMoved,
  parseLabels,
  runDecision,
  selectionOutputs,
  SKILL_ENTRY,
  skillSelection,
} from './skill-scope.mjs';

const SKILLS_ROOT = '.github/skills';
const EVALS_ROOT = 'evals/skills';
const CWD = process.cwd();

const git = (args) => runGit({ args, cwd: CWD });

const runnableSkills = () =>
  readdirSync(EVALS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => name)
    .filter(
      (name) =>
        existsSync(join(EVALS_ROOT, name, 'eval.yaml')) &&
        existsSync(join(SKILLS_ROOT, name, 'SKILL.md')),
    );

const readHead = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined;

const unresolvable = (ref = '--base') =>
  new Error(`cannot resolve a merge base with ${ref}`);

const knownRef = (ref) => {
  const known = [
    'HEAD',
    ...(git(['for-each-ref', '--format=%(refname:short)']) ?? '').split('\n'),
  ].find((name) => name === ref);
  if (known === undefined) throw unresolvable(ref);
  return known;
};

const mergeBase = (ref) => {
  const base = git(['merge-base', knownRef(ref), 'HEAD']);
  if (base === undefined) throw unresolvable(ref);
  return base;
};

const changedSince = (base) =>
  (git(['diff', '--name-only', '--no-renames', base, 'HEAD']) ?? '')
    .split('\n')
    .filter(Boolean);

const catalogEntries = ({ base, changed }) =>
  changed
    .filter((path) => SKILL_ENTRY.test(path))
    .map((path) => ({
      after: readHead(path),
      before: git(['show', `${base}:${path}`]),
    }));

const main = () => {
  const { values } = parseArgs({
    options: {
      base: { type: 'string' },
      labels: { default: '[]', type: 'string' },
    },
  });
  const base = mergeBase(values.base);
  const changed = changedSince(base);
  const selection = skillSelection({
    changed,
    moved: catalogMoved(catalogEntries({ base, changed })),
    runnable: runnableSkills(),
  });
  const decision = runDecision({
    labels: parseLabels(values.labels),
    scope: selection.scope,
  });
  console.log(selectionOutputs({ ...selection, ...decision }).join('\n'));
};

try {
  main();
} catch (error) {
  console.error(
    `select-skills: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
