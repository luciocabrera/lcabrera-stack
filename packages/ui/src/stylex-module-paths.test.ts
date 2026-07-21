/**
 * Freezes the package-relative path of every `*.stylex.ts` module.
 *
 * StyleX derives the name of each custom property a `defineVars` call
 * produces from `packageName:pathRelativeToPackageRoot` — the path *is* the
 * identity, and it is computed without reading the file. Moving or renaming
 * one of these modules therefore silently renames every variable it defines.
 * Inside this repo nothing breaks, because every consumer recompiles from
 * source in the same pass. For a published `@lcabrera/ui` it is a breaking change
 * that no type, lint rule or test would otherwise catch: a consumer's
 * `createTheme` keeps compiling and simply stops matching, so their theme
 * silently reverts to defaults.
 *
 * Renaming a module is a MAJOR version bump for this package, never a
 * refactor. This test exists so that decision is made deliberately rather
 * than discovered by a consumer.
 */

import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

import frozenPaths from './stylex-module-paths.test.json' with { type: 'json' };

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

// Order is irrelevant — both tests compare by membership — so this is left
// unsorted. The recorded JSON is sorted purely so its diffs stay readable.
const currentStylexModulePaths = readdirSync(path.resolve(packageRoot, 'src'), {
  encoding: 'utf8',
  recursive: true,
})
  .filter((entry) => entry.endsWith('.stylex.ts'))
  .map((entry) => `src/${entry.replaceAll(path.sep, '/')}`);

it('no *.stylex.ts module has moved or been renamed', () => {
  const missing = frozenPaths.filter(
    (recorded) => !currentStylexModulePaths.includes(recorded),
  );

  expect(
    missing,
    `These *.stylex.ts modules moved, were renamed, or were deleted:\n  ${missing.join('\n  ')}\n\nEach path is the identity of the custom properties its defineVars calls produce, so this renames them for every consumer and silently breaks their createTheme. If the move is intended, it is a MAJOR bump for @lcabrera/ui — update stylex-module-paths.test.json in the same commit.`,
  ).toEqual([]);
});

it('every *.stylex.ts module is recorded', () => {
  const unrecorded = currentStylexModulePaths.filter(
    (found) => !frozenPaths.includes(found),
  );

  expect(
    unrecorded,
    `These *.stylex.ts modules are not recorded, so nothing is guarding their paths:\n  ${unrecorded.join('\n  ')}\n\nAdd them to stylex-module-paths.test.json.`,
  ).toEqual([]);
});
