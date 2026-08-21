#!/usr/bin/env node

/**
 * Caps the size of tooling scripts, which nothing else governs — path rules
 * scoped to TS/TSX do not see them, a per-workspace eslint fan-out never reaches
 * a root `scripts/`, and a per-function complexity limit passes a 650-line file
 * of small functions.
 *
 * Inherited debt is grandfathered in a baseline file with eslint-suppressions
 * semantics: a baselined file may not GROW, a non-baselined one may not exceed
 * the ceiling, and one that shrank below it should lose its entry. Regenerating
 * takes `--write`, so accepting new debt is a reviewable JSON diff rather than a
 * silent raise.
 *
 * The deciding half is `./script-size.mjs` (pure); this file is the walking, the
 * printing and the exit code.
 *
 * Usage:
 *   repo-verify-script-size            verify (default)
 *   repo-verify-script-size --write    regenerate the baseline
 *
 * Exit codes: 0 = every script is within its limit, 1 = at least one breaches.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { readGates } from './config.mjs';
import { resolveHostRoot } from './host-root.mjs';
import {
  ALWAYS_SKIPPED,
  baselineFor,
  countCodeLines,
  findingsFor,
} from './script-size.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

const SCRIPT_FILE = /\.[mc]js$/;

const toPosix = (value) => value.replaceAll('\\', '/');

const findScripts = ({ directory, skipped }) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      return skipped.has(entry.name)
        ? []
        : findScripts({ directory: full, skipped });
    }
    return SCRIPT_FILE.test(entry.name)
      ? [toPosix(relative(REPO_ROOT, full))]
      : [];
  });

const measure = (skipped) =>
  findScripts({ directory: REPO_ROOT, skipped })
    .map((file) => ({
      file,
      lines: countCodeLines(readFileSync(join(REPO_ROOT, file), 'utf8')),
    }))
    .toSorted((a, b) => b.lines - a.lines);

const readBaseline = (baselineFile) => {
  try {
    return JSON.parse(readFileSync(join(REPO_ROOT, baselineFile), 'utf8'));
  } catch {
    return {};
  }
};

const writeBaseline = ({ baselineFile, ceiling, measured }) => {
  const baseline = baselineFor({ ceiling, measured });
  writeFileSync(
    join(REPO_ROOT, baselineFile),
    `${JSON.stringify(baseline, null, 2)}\n`,
  );
  console.log(
    `Wrote ${baselineFile}: ${Object.keys(baseline).length} script(s) over ${ceiling} code lines grandfathered.`,
  );
};

/** A warning is annotated in Actions and indented locally; either way it is not a failure. */
const printWarnings = (warnings) => {
  for (const warning of warnings) {
    console.error(
      process.env.GITHUB_ACTIONS === 'true'
        ? `::warning::${warning}`
        : `  ⚠ ${warning}`,
    );
  }
};

const printProblems = ({ guideDoc, problems }) => {
  console.error(`\nScript-size gate — ${problems.length} file(s) too large:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    guideDoc === ''
      ? '\nKeep tooling scripts focused.'
      : `\nKeep tooling scripts focused. See \`${guideDoc}\`.`,
  );
};

const verify = ({ baselineFile, ceiling, guideDoc, measured }) => {
  const baseline = readBaseline(baselineFile);
  const { problems, warnings } = findingsFor({ baseline, ceiling, measured });

  printWarnings(warnings);
  if (problems.length > 0) {
    printProblems({ guideDoc, problems });
    process.exitCode = 1;
    return;
  }
  console.log(
    `Script-size gate passed: ${measured.length} script(s), ` +
      `${Object.keys(baseline).length} grandfathered, ceiling ${ceiling}.`,
  );
};

try {
  const { scriptSize } = readGates(REPO_ROOT);
  const measured = measure(
    new Set([...ALWAYS_SKIPPED, ...scriptSize.skipDirs]),
  );

  if (process.argv.includes('--write')) {
    writeBaseline({ ...scriptSize, measured });
  } else {
    verify({ ...scriptSize, measured });
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
