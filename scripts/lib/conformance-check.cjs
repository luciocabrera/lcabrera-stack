/**
 * The structural conformance run over every agent-facing artifact: frontmatter
 * contract, path references, description quality.
 *
 * Why: a malformed, dead-pointing or unselectable artifact fails silently, and
 * nothing else on the merge bar reads these files as a set.
 * Usage: `require('./lib/conformance-check.cjs').checkConformance({ repoRoot })`.
 */
'use strict';

const fs = require('node:fs');

const { KINDS, collectArtifacts } = require('./conformance-artifacts.cjs');
const { contractFindings } = require('./conformance-contract.cjs');
const { referenceFindings } = require('./conformance-references.cjs');
const { descriptionFindings } = require('./conformance-triggers.cjs');

/**
 * @param {{ filePath: string, kind: string, label: string, parsed: { body: string } | null }} artifact
 */
const artifactReferenceFindings = (artifact, repoRoot) =>
  referenceFindings({
    filePath: artifact.filePath,
    label: artifact.label,
    markdown:
      artifact.parsed?.body ?? fs.readFileSync(artifact.filePath, 'utf8'),
    repoRoot,
  }).map((found) => ({
    kind: artifact.kind,
    label: artifact.label,
    message: found.message,
  }));

/**
 * @param {{ repoRoot?: string }} [args]
 */
const checkConformance = (args = {}) => {
  const repoRoot = args.repoRoot ?? process.cwd();
  const collected = collectArtifacts({ repoRoot });

  const findings = [
    ...collected.findings,
    ...collected.artifacts.flatMap((artifact) => [
      ...contractFindings(artifact),
      ...descriptionFindings(artifact),
      ...artifactReferenceFindings(artifact, repoRoot),
    ]),
  ];

  const checked = Object.fromEntries(
    Object.keys(KINDS).map((kind) => [
      kind,
      collected.artifacts
        .filter((artifact) => artifact.kind === kind)
        .map((artifact) => artifact.name),
    ]),
  );

  return {
    checked,
    findings,
    skippedDirectories: collected.skippedDirectories,
    unreadableSkills: collected.unreadableNames,
  };
};

module.exports = {
  checkConformance,
};
