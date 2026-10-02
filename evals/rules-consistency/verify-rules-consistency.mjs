#!/usr/bin/env node
/**
 * Checks that the path rules under .claude/rules agree with the AGENTS.md
 * rules index and with the tracked tree. Path resolution inside a rule is
 * `harness:verify`'s job and is not repeated here. Overlapping rules are
 * printed, not failed: no rule declares a precedence a check could read.
 *
 * Usage (from the repo root): vp run evals:rules:verify
 * Exit codes: 0 = consistent, 1 = at least one finding (all are listed).
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  coverage,
  coverageFindings,
  indexedRules,
  indexFindings,
  overlaps,
  ruleGlobs,
} from './rules-consistency.mjs';

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
      return {
        globs: ruleGlobs(readFileSync(join(repoRoot, label), 'utf8')),
        label,
      };
    });

const trackedFiles = (repoRoot) =>
  execFileSync('git', ['ls-files', '-z'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);

const describeOverlap = ({ first, second, shared }) =>
  `  ${first} + ${second}: ${shared.length} file(s), e.g. ${shared.slice(0, SAMPLE_SIZE).join(', ')}`;

const main = () => {
  const repoRoot = process.cwd();
  const rules = readRules(repoRoot);
  const covered = coverage({ files: trackedFiles(repoRoot), rules });
  const findings = [
    ...indexFindings({
      indexFile: INDEX_FILE,
      indexed: indexedRules(
        readFileSync(join(repoRoot, INDEX_FILE), 'utf8'),
        INDEX_HEADING,
      ),
      onDisk: rules.map(({ label }) => label),
    }),
    ...coverageFindings({ covered, rules }),
  ];

  const shared = overlaps({ covered, rules });
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

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
