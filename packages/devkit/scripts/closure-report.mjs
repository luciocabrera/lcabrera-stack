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

/** Commands a consumer's shell is expected to provide regardless of this kit. */
export const BASELINE_COMMANDS = [
  'bash',
  'gh',
  'git',
  'node',
  'npm',
  'npx',
  'sh',
];

/**
 * @param {{ allowedCommands?: string[], allowedConfigKeys?: string[],
 *   directory: string, root: string }} args
 */
export const analyseDirectory = ({
  allowedCommands = BASELINE_COMMANDS,
  allowedConfigKeys = [],
  directory,
  root,
  shipped = new Set(),
}) => {
  const files = readFilesUnder({ directory, root });
  const rootDirectory = relative(root, directory).replaceAll('\\', '/');
  const { escapes } = analyseClosure({
    allowedCommands,
    allowedConfigKeys,
    exists: (path) => existsSync(resolve(root, path)),
    files,
    rootDirectory,
    shipped,
  });
  return { directory: rootDirectory, escapes, fileCount: files.length };
};

const ESCAPE_VERBS = {
  command: 'runs',
  import: 'imports',
  link: 'needs',
  requires: 'declares',
};

/**
 * One wording for every mode. The verb is what separates the four kinds for a
 * reader, and a finding printed without it says only that something escaped —
 * which does not tell anyone what to do about it.
 */
export const describeEscape = (finding) =>
  `${finding.file}:${finding.line}  ${ESCAPE_VERBS[finding.kind]} ${finding.resolved ?? finding.reference}`;

/** @param {ReturnType<typeof analyseDirectory>[]} results */
export const renderClosureReport = (results) => {
  const lines = results.flatMap((result) => {
    if (result.escapes.length === 0) {
      return [`✓ ${result.directory} — self-contained`];
    }
    return [
      `✗ ${result.directory}`,
      ...result.escapes.map((finding) => `    ${describeEscape(finding)}`),
    ];
  });
  return lines.join('\n');
};
