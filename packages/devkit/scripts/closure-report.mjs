/*
 * Renders a closure analysis for a human and for a gate.
 *
 * Kept apart from the analysis itself so the rules stay testable without a
 * filesystem, and so the wording of a finding can change without touching what
 * counts as one.
 */

import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { analyseClosure } from './closure.mjs';
import { readFilesUnder } from './files.mjs';

export const BASELINE_COMMANDS = [
  'bash',
  'devkit',
  'gh',
  'git',
  'node',
  'npm',
  'npx',
  'sh',
];

/**
 * @param {{ agentDirectory?: string, allowedBins?: string[],
 *   allowedCommands?: string[], allowedConfigKeys?: string[],
 *   directory: string, hookDirectory?: string, root: string }} args
 */
export const analyseDirectory = ({
  agentDirectory,
  allowedBins,
  allowedCommands = BASELINE_COMMANDS,
  allowedConfigKeys = [],
  directory,
  hookDirectory,
  root,
  shipped = new Set(),
}) => {
  const files = readFilesUnder({ directory, root });
  const rootDirectory = relative(root, directory).replaceAll('\\', '/');
  const { escapes, unchecked } = analyseClosure({
    agentDirectory,
    allowedBins,
    allowedCommands,
    allowedConfigKeys,
    exists: (path) => existsSync(resolve(root, path)),
    files,
    hookDirectory,
    rootDirectory,
    shipped,
  });
  return {
    directory: rootDirectory,
    escapes,
    fileCount: files.length,
    unchecked,
  };
};

const ESCAPE_VERBS = {
  bin: 'invokes',
  command: 'runs',
  import: 'imports',
  link: 'needs',
  missing: 'runs nonexistent',
  requires: 'declares',
  secret: 'reads',
};

export const describeEscape = (finding) =>
  `${finding.file}:${finding.line}  ${ESCAPE_VERBS[finding.kind]} ${finding.resolved ?? finding.reference}`;

/**
 * @param {{ unchecked?: string[] }} result
 * @returns {string[]}
 */
export const describeUnchecked = ({ unchecked = [] }) =>
  unchecked.map((path) => `    unchecked  ${path}  no resolver reads it`);

const readCount = ({ fileCount, unchecked = [] }) =>
  fileCount - unchecked.length;

/** @param {ReturnType<typeof analyseDirectory>[]} results */
export const renderClosureReport = (results) => {
  const lines = results.flatMap((result) => {
    const unchecked = describeUnchecked(result);
    if (result.escapes.length === 0) {
      return [
        unchecked.length === 0
          ? `✓ ${result.directory} — self-contained`
          : `✓ ${result.directory} — no escapes in the ${readCount(result)} file(s) a resolver reads`,
        ...unchecked,
      ];
    }
    return [
      `✗ ${result.directory}`,
      ...result.escapes.map((finding) => `    ${describeEscape(finding)}`),
      ...unchecked,
    ];
  });
  return lines.join('\n');
};
