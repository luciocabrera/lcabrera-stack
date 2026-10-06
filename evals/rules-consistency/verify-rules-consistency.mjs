#!/usr/bin/env node
/**
 * Checks that the path rules under .claude/rules agree with the AGENTS.md
 * rules index and with the tracked tree. Path resolution inside a rule is
 * `harness:verify`'s job and is not repeated here. Overlapping rules are
 * printed, not failed: no rule declares a precedence a check could read.
 *
 * Each run also writes a run envelope under .tmp/eval-results/rules-consistency/.
 *
 * Usage (from the repo root): vp run evals:rules:verify
 * Exit codes: 0 = consistent, 1 = at least one finding (all are listed) or an
 * envelope that fails validation, 130/143 = interrupted.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runGit } from '../../packages/repo-standards/scripts/git-exec.mjs';
import { runSettings } from '../run-envelope.mjs';
import {
  recordRun,
  runIdentity,
  runnerHarnessVersion,
} from '../run-record.mjs';

import {
  coverage,
  coverageFindings,
  indexedRules,
  indexFindings,
  overlaps,
  ruleGlobs,
} from './rules-consistency.mjs';
import { rulesRecords } from './rules-envelope.mjs';

const RULES_ROOT = '.claude/rules';
const INDEX_FILE = 'AGENTS.md';
const INDEX_HEADING = '## 2. Path-Specific Rules';
const SAMPLE_SIZE = 3;

const readRules = (repoRoot) =>
  readdirSync(join(repoRoot, RULES_ROOT))
    .filter((name) => name.endsWith('.md'))
    .toSorted((a, b) => a.localeCompare(b))
    .map((name) => {
      const label = `${RULES_ROOT}/${name}`;
      const source = readFileSync(join(repoRoot, label), 'utf8');
      return { globs: ruleGlobs(source), label, source };
    });

const trackedFiles = (repoRoot) => {
  const files = (runGit({ args: ['ls-files', '-z'], cwd: repoRoot }) ?? '')
    .split('\0')
    .filter(Boolean);
  if (files.length === 0) {
    throw new Error(
      '`git ls-files` listed no tracked files. Refusing to report a clean pass on no data.',
    );
  }
  return files;
};

const describeOverlap = ({ first, second, shared }) =>
  `  ${first} + ${second}: ${shared.length} file(s), e.g. ${shared.slice(0, SAMPLE_SIZE).join(', ')}`;

const checkRules = (repoRoot) => {
  const rules = readRules(repoRoot);
  const covered = coverage({ files: trackedFiles(repoRoot), rules });
  const indexed = indexedRules(
    readFileSync(join(repoRoot, INDEX_FILE), 'utf8'),
    INDEX_HEADING,
  );
  return {
    coverageFindings: coverageFindings({ covered, rules }),
    indexed,
    indexFindings: indexFindings({
      indexed,
      indexFile: INDEX_FILE,
      onDisk: rules.map(({ label }) => label),
    }),
    rules,
    shared: overlaps({ covered, rules }),
  };
};

const report = ({
  coverageFindings: covered,
  indexFindings: index,
  rules,
  shared,
}) => {
  const findings = [...index, ...covered];
  if (shared.length > 0) {
    console.log('Rules that load together (informational):');
    console.log(shared.map(describeOverlap).join('\n'));
  }
  if (findings.length > 0) {
    console.error('Rules consistency failed:');
    console.error(findings.map((finding) => `  - ${finding}`).join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(`Rules consistency passed for ${rules.length} path rule(s).`);
};

const main = async () => {
  const identity = runIdentity();
  const startedAt = Date.parse(identity.started_at);
  const checked = checkRules(process.cwd());
  const { subjects, tasks, trials } = rulesRecords({
    ...checked,
    finishedAt: Date.now(),
    startedAt,
  });
  await recordRun({
    execute: ({ addTrial }) => {
      for (const trial of trials) {
        addTrial(trial);
      }
      report(checked);
    },
    identity,
    plan: {
      harnessVersion: runnerHarnessVersion(import.meta.url),
      settings: runSettings({
        argv: process.argv.slice(2),
        concurrency: 1,
        runs: 1,
      }),
      subjects,
      suite: 'rules-consistency',
      tasks,
    },
  });
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
