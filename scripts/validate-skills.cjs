#!/usr/bin/env node

/*
 * Why: a skill folder without SKILL.md, or a SKILL.md / agent file pointing
 * at a script that is not there, used to pass this gate — the same silent
 * skip that hid `.github/skills/app-graph/` and the stale fallow-scan runner
 * path. Usage: `node scripts/validate-skills.cjs` (optional `--json`).
 * Exit 0 only when every skill directory is a skill or an explicit support
 * allowlist entry, every SKILL.md contract holds, and every referenced
 * script path exists.
 */

const {
  parseFrontmatter,
  validateSkills,
} = require('./lib/validate-skills-contract.cjs');

const runCli = () => {
  const shouldOutputJson = process.argv.includes('--json');
  const result = validateSkills({ repoRoot: process.cwd() });

  if (shouldOutputJson) {
    console.log(JSON.stringify(result, null, 2));
  }

  if (result.errors.length > 0) {
    console.error('Skill validation failed:');
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Skill validation passed for ${result.checkedSkillCount} skill directories.`,
  );
  if (result.skippedDirectories.length > 0) {
    console.log(
      `Skipped non-skill directories: ${result.skippedDirectories.join(', ')}`,
    );
  }
};

if (require.main === module) {
  runCli();
}

module.exports = {
  parseFrontmatter,
  validateSkills,
};
