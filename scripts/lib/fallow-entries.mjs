/**
 * Pure readers for the fallow entry roster, so the hand-listed part of it can
 * be asserted against what the repository invokes (`fallow-entries.test.mjs`).
 *
 * Fallow derives most entry points itself: every script a package.json
 * `scripts` block runs and every package's `bin`. `.fallowrc.json` names only
 * what it cannot see — the scripts a workflow, a Claude hook or a shell script
 * runs — plus the test files and config fragments outside the import graph.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { stripJsoncComments } from './jsonc.mjs';

const NODE_INVOCATION =
  /(?<=\bnode[ \t]+(?:\\?")?(?:\$[A-Z_]+\/)?)scripts\/(?:[\w-]+\/)*[\w-]+\.(?:mjs|cjs)/g;

const GLOB_CHARACTER = /[*?[{]/;

export const scriptInvocationsIn = (text) => [
  ...new Set(text.match(NODE_INVOCATION) ?? []),
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
