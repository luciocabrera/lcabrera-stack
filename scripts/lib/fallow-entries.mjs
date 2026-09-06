/**
 * Pure readers for the fallow entry roster, so the hand-listed part of it can
 * be asserted against what the repository invokes (`fallow-entries.test.mjs`).
 * The entry policy is in .github/skills/fallow-code-checker/CONFIGURATION.md.
 */
import { stripJsoncComments } from '../../packages/repo-standards/scripts/jsonc.mjs';

const NODE_ARGUMENT = /\bnode[ \t]+([^ \t\r\n]+)/g;

const SHELL_QUOTING = /[\\"']/g;

const VARIABLE_PREFIX = /^\$[A-Z_]+\//;

const ROOT_SCRIPT_PATH = /^scripts\/[\w/-]+\.[mc]js/;

const GLOB_CHARACTER = /[*?[{]/;

const unwrapArgument = (argument) =>
  argument.replaceAll(SHELL_QUOTING, '').replace(VARIABLE_PREFIX, '');

export const scriptInvocationsIn = (text) => [
  ...new Set(
    [...text.matchAll(NODE_ARGUMENT)]
      .map(([, argument]) => unwrapArgument(argument).match(ROOT_SCRIPT_PATH))
      .filter((match) => match !== null)
      .map(([path]) => path),
  ),
];

export const readFallowEntries = (text) =>
  JSON.parse(stripJsoncComments(text)).entry;

export const isExactPath = (entry) => !GLOB_CHARACTER.test(entry);

export const isTestFilePattern = (entry) => entry.endsWith('.test.mjs');

export const isConfigFragmentPattern = (entry) =>
  entry.endsWith('/config/*.ts');

export const manifestInvokes = (manifest, path) =>
  Object.values(manifest.scripts ?? {}).some((command) =>
    command.includes(path),
  );
