/**
 * The skills-shaped view of the harness conformance run, for
 * `scripts/validate-skills.cjs` and the compliance report that reads it.
 *
 * Why: the checks live once in `lib/conformance-*.cjs`, so the merge-bar gate
 * and this report can never diverge on what conformance means. Only the
 * projection narrows: the report stamps every finding as a skill-contract
 * finding under `.github/skills/`, so a rule or subagent finding here would be
 * placed where it is not. `verify-harness-conformance.cjs` carries those.
 * Usage: `require('./lib/validate-skills-contract.cjs').validateSkills(...)`.
 */
'use strict';

const {
  SUPPORT_DIRECTORIES,
} = require('../../packages/repo-standards/scripts/conformance-artifacts.cjs');
const {
  checkConformance,
} = require('../../packages/repo-standards/scripts/conformance-check.cjs');
const {
  parseFrontmatter,
} = require('../../packages/repo-standards/scripts/conformance-frontmatter.cjs');
const {
  extractRelativeLinks,
  extractScriptPaths,
} = require('../../packages/repo-standards/scripts/conformance-references.cjs');

/**
 * @typedef {Object} ValidateSkillsResult
 * @property {number} checkedSkillCount
 * @property {readonly string[]} checkedSkills
 * @property {readonly string[]} skippedDirectories
 * @property {readonly string[]} errors
 */

/**
 * @param {{ repoRoot?: string }} [args]
 * @returns {ValidateSkillsResult}
 */
const validateSkills = (args = {}) => {
  const result = checkConformance({ repoRoot: args.repoRoot ?? process.cwd() });

  const checkedSkills = [
    ...result.checked.skill,
    ...result.unreadableSkills,
  ].sort((a, b) => a.localeCompare(b));

  return {
    checkedSkillCount: checkedSkills.length,
    checkedSkills,
    errors: result.findings
      .filter((found) => found.kind === 'skill')
      .map((found) => found.message),
    skippedDirectories: result.skippedDirectories,
  };
};

module.exports = {
  SUPPORT_DIRECTORIES,
  extractRelativeLinks,
  extractScriptPaths,
  parseFrontmatter,
  validateSkills,
};
