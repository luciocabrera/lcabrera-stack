#!/usr/bin/env node
/**
 * Gate: no formatter/linter config file exists that no engine reads.
 *
 * Why this exists: eight such files were sitting in this repo — `.oxfmtrc.json`,
 * `.prettierrc.json`, `.prettierignore` and `.eslintignore` at the root, plus
 * `.claudelintignore` and workspace-level twins under `apps/react-router/`.
 * Prettier is not a dependency of any workspace, the formatter is Oxfmt
 * configured in the root `vite.config.ts`, and ESLint's flat config does not
 * read `.eslintignore`. None of them changed any tool's behaviour.
 *
 * That is worse than untidy. The root `.oxfmtrc.json` declared
 * `sortPackageJson: false` while the live config declares `true`, so the file a
 * reader would open to learn the formatting policy said the opposite of the
 * truth — and editing it to change formatting did nothing at all. The two
 * ignore files listed only `miscelanious/`, a directory PR #420 deleted while
 * leaving every file that named it behind. That is the failure this gate
 * exists to catch: a cleanup that removes the thing but not its references.
 *
 * The traversal walks rather than shelling out to `git ls-files`, matching the
 * other gates here: these scripts launch no subprocess, so no PATH-resolved
 * process can be substituted underneath a check that runs on every push.
 *
 * Usage: node scripts/verify-stray-configs.mjs
 * Exit : 0 clean, 1 when a stray config file is present.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { strayConfigsIn } from './lib/stray-configs.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Directories that never hold repo-authored configuration. */
const SKIPPED_DIRS = new Set([
  '.git',
  '.react-router',
  '.tmp',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

/** Every tracked-looking file path under the repo, relative to the root. */
const walk = (dir, prefix = '') =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name)
        ? []
        : walk(join(dir, entry.name), relativePath);
    }
    return [relativePath];
  });

const main = () => {
  const offenders = strayConfigsIn(walk(REPO_ROOT));

  if (offenders.length > 0) {
    process.stderr.write(
      'Config files that no engine in this toolchain reads:\n\n',
    );
    for (const offender of offenders) {
      process.stderr.write(`  • ${offender}\n`);
    }
    process.stderr.write(
      '\nFormatting and linting are configured in the root vite.config.ts\n' +
        '(ADR-042). A config file beside it is read by nothing, and contradicts\n' +
        'the live values the moment either one changes. Delete it, or configure\n' +
        'the behaviour where the toolchain actually looks.\n',
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    'Stray-config gate passed: every formatter/linter config present is one an engine reads.\n',
  );
};

main();
