#!/usr/bin/env node

/*
 * Why: a skill, path rule or subagent definition that is malformed, points at
 * a moved file, or carries a description too vague to ever trigger is never
 * used, and that is indistinguishable from one nobody needed.
 * Usage: `node scripts/verify-harness-conformance.cjs`.
 * Exit 0 only when every artifact under `.github/skills`, `.claude/rules` and
 * `.claude/agents` satisfies its frontmatter contract, every path it names
 * resolves, and every description says when to use it.
 */

const { checkConformance } = require('./lib/conformance-check.cjs');
const { reportConformance } = require('./lib/conformance-report.cjs');

const KIND_LABELS = {
  rule: 'path rules',
  skill: 'skills',
  subagent: 'subagents',
};

/**
 * @param {Record<string, readonly string[]>} checked
 * @returns {string}
 */
const renderCounts = (checked) =>
  Object.entries(checked)
    .map(([kind, names]) => `${names.length} ${KIND_LABELS[kind] ?? kind}`)
    .join(', ');

const runCli = () => {
  const result = checkConformance({ repoRoot: process.cwd() });

  process.exitCode = reportConformance({
    failureHeading: 'Harness conformance failed:',
    messages: result.findings.map((found) => found.message),
    passedMessage: `Harness conformance passed: ${renderCounts(result.checked)}.`,
    skippedDirectories: result.skippedDirectories,
  });
};

if (require.main === module) {
  runCli();
}
