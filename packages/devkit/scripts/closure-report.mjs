/*
 * Renders a closure analysis for a human and for a gate.
 *
 * Kept apart from the analysis itself so the rules stay testable without a
 * filesystem, and so the wording of a finding can change without touching what
 * counts as one.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

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
 * @param {{ allowedCommands?: string[], directory: string, root: string }} args
 */
export const analyseDirectory = ({
  allowedCommands = BASELINE_COMMANDS,
  directory,
  root,
}) => {
  const files = readFilesUnder({ directory, root });
  const rootDirectory = directory
    .replace(root, '')
    .replace(/^[/\\]/, '')
    .split(/[/\\]/)
    .join('/');
  const { escapes } = analyseClosure({
    allowedCommands,
    exists: (path) => existsSync(resolve(root, path)),
    files,
    rootDirectory,
  });
  return { directory: rootDirectory, escapes, fileCount: files.length };
};

const ESCAPE_VERBS = {
  command: 'runs',
  import: 'imports',
  link: 'needs',
};

const describeEscape = (escape) =>
  `${escape.file}:${escape.line}  ${ESCAPE_VERBS[escape.kind]} ${escape.resolved ?? escape.reference}`;

/** @param {ReturnType<typeof analyseDirectory>[]} results */
export const renderClosureReport = (results) => {
  const lines = results.flatMap((result) => {
    if (result.escapes.length === 0) {
      return [`✓ ${result.directory} — self-contained`];
    }
    return [
      `✗ ${result.directory}`,
      ...result.escapes.map((escape) => `    ${describeEscape(escape)}`),
    ];
  });
  return lines.join('\n');
};
