/**
 * The frontmatter contract each artifact kind has to satisfy: a parseable
 * block, the fields its loader reads, and a name that matches where the file
 * sits.
 *
 * Why: a skill or subagent whose frontmatter does not parse is never loaded,
 * and a rule with no `paths` never matches a file — both look exactly like an
 * artifact nobody happened to need.
 * Usage: `require('./lib/conformance-contract.cjs').contractFindings(...)`.
 */
'use strict';

const { KINDS } = require('./conformance-artifacts.cjs');

/**
 * @param {{ kind: string, label: string }} artifact
 * @param {string} message
 */
const finding = (artifact, message) => ({
  kind: artifact.kind,
  label: artifact.label,
  message,
});

/**
 * @param {{
 *   kind: string;
 *   label: string;
 *   name: string;
 *   parsed: { frontmatter: Record<string, string>, lists: Record<string, readonly string[]> } | null;
 * }} artifact
 */
const missingFieldFindings = (artifact) =>
  KINDS[artifact.kind].requiredFields
    .filter((field) => {
      const value = artifact.parsed?.frontmatter[field];
      const list = artifact.parsed?.lists[field] ?? [];
      return (
        (typeof value !== 'string' || value.trim().length === 0) &&
        list.length === 0
      );
    })
    .map((field) =>
      finding(
        artifact,
        `Missing required frontmatter field "${field}" in ${artifact.label}`,
      ),
    );

/**
 * @param {{
 *   kind: string;
 *   label: string;
 *   name: string;
 *   parsed: { frontmatter: Record<string, string> } | null;
 * }} artifact
 */
const nameMatchFindings = (artifact) => {
  const declared = artifact.parsed?.frontmatter.name;
  if (typeof declared !== 'string' || declared === artifact.name) {
    return [];
  }

  const source =
    KINDS[artifact.kind].nameSource === 'directory' ? 'directory' : 'file name';

  return [
    finding(
      artifact,
      `Frontmatter name in ${artifact.label} does not match its ${source}: expected "${artifact.name}", got "${declared}"`,
    ),
  ];
};

/**
 * @param {{
 *   kind: string;
 *   label: string;
 *   name: string;
 *   parsed: object | null;
 * }} artifact
 */
const contractFindings = (artifact) => {
  if (artifact.parsed === null) {
    return [
      finding(
        artifact,
        `Unparseable or missing frontmatter in ${artifact.label}`,
      ),
    ];
  }

  return [...missingFieldFindings(artifact), ...nameMatchFindings(artifact)];
};

module.exports = {
  contractFindings,
};
