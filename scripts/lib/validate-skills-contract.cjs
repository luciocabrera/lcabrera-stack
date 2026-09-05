/**
 * The skills-shaped view of the harness conformance run, for
 * `scripts/validate-skills.cjs` and the compliance report that reads it.
 *
 * Why: the checks live once in `lib/conformance-*.cjs`, so the merge-bar gate
 * and this report can never diverge on what conformance means.
 * Usage: `require('./lib/validate-skills-contract.cjs').validateSkills(...)`.
 */
'use strict';

const { SUPPORT_DIRECTORIES } = require('./conformance-artifacts.cjs');
const { checkConformance } = require('./conformance-check.cjs');
const { parseFrontmatter } = require('./conformance-frontmatter.cjs');
const {
  extractRelativeLinks,
  extractScriptPaths,
} = require('./conformance-references.cjs');

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
    errors: result.findings.map((found) => found.message),
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
