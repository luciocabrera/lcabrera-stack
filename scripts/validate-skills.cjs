#!/usr/bin/env node

/*
 * Why: a skill folder without SKILL.md, or a SKILL.md pointing at a script
 * that is not there, used to pass this gate — the same silent skip that hid a
 * scripts-only skill directory and the stale fallow-scan runner path. This is
 * the skills-only view of the conformance run that
 * `verify-harness-conformance.cjs` gates on, and it feeds the compliance report.
 * Usage: `node scripts/validate-skills.cjs` (optional `--json`).
 * Exit 0 only when that run reports nothing against a skill.
 */

const { reportConformance } = require('./lib/conformance-report.cjs');
const {
  parseFrontmatter,
  validateSkills,
} = require('./lib/validate-skills-contract.cjs');

const runCli = () => {
  const result = validateSkills({ repoRoot: process.cwd() });

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  }

  process.exitCode = reportConformance({
    failureHeading: 'Skill validation failed:',
    messages: result.errors,
    passedMessage: `Skill validation passed for ${result.checkedSkillCount} skill directories.`,
    skippedDirectories: result.skippedDirectories,
  });
};

if (require.main === module) {
  runCli();
}

module.exports = {
  parseFrontmatter,
  validateSkills,
};
