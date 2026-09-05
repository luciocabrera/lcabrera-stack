/**
 * A throwaway repository holding one conforming skill, rule and subagent, for
 * the conformance tests to plant a violation into.
 *
 * Why: every conformance test file needs the same three roots on disk, and a
 * fixture that drifts between them would let a planted violation pass for the
 * wrong reason.
 * Usage: `import { conformanceMessages } from './lib/conformance-fixtures.mjs'`.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { checkConformance } = require('./conformance-check.cjs');

export const SKILL = `---
name: demo
description: Demo skill for the conformance fixture. Use when a test needs one skill that passes every check in scripts/lib.
---

# Demo
`;

export const RULE = `---
paths: ['**/*.demo.ts']
---

# Demo rule
`;

export const SUBAGENT = `---
name: demo-agent
description: Demo subagent for the conformance fixture. Use when a test needs one subagent that passes every check in scripts/lib.
---

# Demo agent
`;

/**
 * @param {Record<string, string>} files
 * @returns {string}
 */
const makeConformanceRepo = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'harness-conformance-'));

  const seeded = {
    '.claude/agents/demo-agent.md': SUBAGENT,
    '.claude/rules/demo.md': RULE,
    '.github/skills/demo/SKILL.md': SKILL,
    ...files,
  };

  for (const [relative, contents] of Object.entries(seeded)) {
    const full = join(root, relative);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, contents);
  }

  return root;
};

/**
 * @template T
 * @param {Record<string, string>} files
 * @param {(repoRoot: string) => T} run
 * @returns {T}
 */
export const withConformanceRepo = (files, run) => {
  const root = makeConformanceRepo(files);
  try {
    return run(root);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
};

/**
 * @param {Record<string, string>} [files]
 * @returns {readonly string[]}
 */
export const conformanceMessages = (files = {}) =>
  withConformanceRepo(files, (repoRoot) =>
    checkConformance({ repoRoot }).findings.map((found) => found.message),
  );
