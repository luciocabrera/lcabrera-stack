#!/usr/bin/env node

/**
 * Fails when a formatter/linter config file is present that no engine in this
 * repository's toolchain reads.
 *
 * Why: such a file is worse than untidy. It is what a reader opens to learn the
 * policy, so it states the policy — and being read by nothing, it can state the
 * opposite of the truth indefinitely while edits to it change nothing.
 *
 * The traversal walks rather than shelling out to a VCS, matching the other
 * gates here: these scripts launch no subprocess, so nothing PATH-resolved can
 * be substituted underneath a check that runs on every push.
 *
 * The deciding half is `./stray-configs.mjs` (pure); the roster of unread names
 * is the consumer's, in `devkit.config.json`.
 *
 * Usage: repo-verify-stray-configs
 * Exit codes: 0 = clean, 1 = a stray config file, or no roster to check against.
 */

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { readGates } from './config.mjs';
import { resolveHostRoot } from './host-root.mjs';
import { ALWAYS_SKIPPED } from './script-size.mjs';
import { rosterProblem, strayConfigsIn } from './stray-configs.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

/** Every file under the repository, as a root-relative POSIX path. */
const walk = ({ directory, prefix = '', skipped }) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      return skipped.has(entry.name)
        ? []
        : walk({
            directory: join(directory, entry.name),
            prefix: path,
            skipped,
          });
    }
    return [path];
  });

const reportOffenders = ({ configuredIn, offenders }) => {
  process.stderr.write(
    'Config files that no engine in this toolchain reads:\n\n',
  );
  for (const offender of offenders) process.stderr.write(`  • ${offender}\n`);
  process.stderr.write(
    configuredIn === ''
      ? '\nA config file nothing loads contradicts the live values the moment\neither one changes. Delete it, or configure the behaviour where the\ntoolchain actually looks.\n'
      : `\nFormatting and linting are configured in ${configuredIn}. A config file\nbeside it is read by nothing, and contradicts the live values the moment\neither one changes. Delete it, or configure the behaviour where the\ntoolchain actually looks.\n`,
  );
};

const main = () => {
  const { strayConfigs } = readGates(REPO_ROOT);

  const problem = rosterProblem(strayConfigs);
  if (problem !== undefined) {
    process.stderr.write(`${problem}\n`);
    process.exitCode = 1;
    return;
  }

  const paths = walk({
    directory: REPO_ROOT,
    skipped: new Set([...ALWAYS_SKIPPED, ...strayConfigs.skipDirs]),
  });
  const offenders = strayConfigsIn({ paths, ...strayConfigs });

  if (offenders.length > 0) {
    reportOffenders({ configuredIn: strayConfigs.configuredIn, offenders });
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Stray-config gate passed: ${paths.length} file(s) checked, every config present is one an engine reads.\n`,
  );
};

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
