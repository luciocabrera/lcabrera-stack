/**
 * Gate: the four public packages carry no suppression that has not been argued
 * for in writing.
 *
 * AGENTS.md §4 holds `packages/ui`, `api`, `server` and `utils` to "every
 * finding gets fixed, never baselined or disabled". That was enforced for the
 * eslint baseline alone (gitignored, so CI has nothing to check out) and for
 * nothing else — the claim was false about `packages/ui` on the day it was
 * written. This makes the other five mechanisms checkable too.
 *
 * The register is `docs/agents/public-package-suppressions.json`. It lives in
 * docs/, not next to this script, on purpose: it is a policy document whose
 * diff is the review, not a build artifact. It is deliberately NOT called a
 * baseline — a baseline is a thing you stop reading.
 *
 * Fails on four conditions:
 *   unapproved   a suppression with no register entry            (the main gate)
 *   grew         more occurrences of an approved key than agreed
 *   stale        a register entry matching nothing               (anti-rot)
 *   undocumented an entry with no real reason or no reference
 *
 * `stale` is what stops this becoming the baselines it replaces: an approval
 * that outlives its code silently re-permits whatever reoccupies that key.
 *
 * Effects (fs, argv, exit) live here; the rules are pure in
 * `./lib/suppressions.mjs` so they can be tested without a repo on disk.
 *
 * Usage: node scripts/verify-suppressions.mjs [--list]
 *   --list  print every suppression found, approved or not, and exit 0
 */
import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import process from 'node:process';

import { publicPackageDirs } from './lib/coverage-workspaces.mjs';
import { readTextWithin } from './lib/safe-read.mjs';
import {
  diffAgainstRegister,
  findBiomeSuppressions,
  findFallowSuppressions,
  findInlineSuppressions,
  gated,
  tally,
} from './lib/suppressions.mjs';

const REPO_ROOT = process.cwd();
const REGISTER_PATH = 'docs/agents/public-package-suppressions.json';
const BASELINE_DIR = 'reports/fallow/baselines';

/**
 * Directories that hold build output, dependencies or another agent's checkout —
 * never reviewed source.
 *
 * `.claude` matters here: it can contain linked worktrees holding a full second
 * copy of the repo, and counting those files would classify every glob as
 * repo-wide (a public-package file's twin always sits outside the package path).
 */
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.react-router',
  '.claude',
  '.git',
  '.tmp',
]);

const SCANNED_EXTENSIONS = ['.ts', '.tsx', '.mjs', '.cjs', '.js', '.jsx'];

/** Every scannable file under a directory, as repo-relative paths. */
const walk = (directory) => {
  let entries = [];
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : walk(full);
    return SCANNED_EXTENSIONS.some((extension) =>
      entry.name.endsWith(extension),
    )
      ? [relative(REPO_ROOT, full).split(sep).join('/')]
      : [];
  });
};

/**
 * Parses JSONC by removing `//` line comments and trailing commas.
 *
 * String-aware: `biome.jsonc`'s own `$schema` value contains `//`, and a naive
 * strip would truncate the document into invalid JSON. Biome itself fails
 * silently on a config parse error (AGENTS.md §4), so this must not.
 */
const parseJsonc = (text) => {
  let out = '';
  let inString = false;
  let inComment = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (inComment) {
      if (char === '\n') {
        inComment = false;
        out += char;
      }
      continue;
    }
    if (inString) {
      out += char;
      if (char === '\\') {
        out += next ?? '';
        index += 1;
      } else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }
    if (char === '/' && next === '/') {
      inComment = true;
      index += 1;
      continue;
    }
    out += char;
  }
  return JSON.parse(out.replaceAll(/,(?=\s*[}\]])/gu, ''));
};

const readJson = (path) =>
  parseJsonc(readTextWithin(join(REPO_ROOT, path), REPO_ROOT));

/** Every fallow baseline document, keyed by its bare filename. */
const readBaselines = () => {
  let names = [];
  try {
    names = readdirSync(join(REPO_ROOT, BASELINE_DIR)).filter((name) =>
      name.endsWith('.json'),
    );
  } catch {
    return {};
  }
  return Object.fromEntries(
    names.map((name) => [
      name.replace(/\.json$/u, ''),
      readJson(`${BASELINE_DIR}/${name}`),
    ]),
  );
};

const report = (label, rows, render) => {
  if (rows.length === 0) return 0;
  process.stdout.write(`\n${label}\n`);
  for (const row of rows) process.stdout.write(`  ${render(row)}\n`);
  return rows.length;
};

const main = () => {
  const packageDirs = publicPackageDirs(REPO_ROOT);
  if (packageDirs.length === 0) {
    process.stderr.write(
      'verify-suppressions: found no public packages. The authority is which\n' +
        'workspaces gitignore eslint-suppressions.json — check that first.\n',
    );
    process.exitCode = 1;
    return;
  }

  const isPublicPath = (path) =>
    packageDirs.some((dir) => path.startsWith(`${dir}/`));
  // The whole tree, so a Biome glob can be classified by whether anything
  // OUTSIDE the public packages also matches it.
  const allFiles = walk(REPO_ROOT);
  const publicFiles = allFiles.filter((path) => isPublicPath(path));
  const otherFiles = allFiles.filter((path) => !isPublicPath(path));

  const found = tally([
    ...publicFiles.flatMap((file) =>
      findInlineSuppressions({
        file,
        text: readTextWithin(join(REPO_ROOT, file), REPO_ROOT),
      }),
    ),
    ...findBiomeSuppressions({
      config: readJson('biome.jsonc'),
      otherFiles,
      publicFiles,
    }),
    ...findFallowSuppressions({ baselines: readBaselines(), isPublicPath }),
  ]);

  const held = gated(found);

  if (process.argv.includes('--list')) {
    for (const row of found)
      process.stdout.write(`${row.count}\t${row.scope}\t${row.key}\n`);
    process.stdout.write(
      `\n${found.length} suppression(s) reaching ${packageDirs.length} public package(s): ` +
        `${held.length} gated here, ${found.length - held.length} repo-wide Biome policy (ADR-035 §7).\n`,
    );
    return;
  }

  const register = readJson(REGISTER_PATH).approved ?? [];
  const { grew, stale, unapproved, undocumented } = diffAgainstRegister({
    found: held,
    register,
  });

  const failures =
    report(
      `Unapproved suppression(s) in a public package — fix the code, or add a justified entry to ${REGISTER_PATH}:`,
      unapproved,
      (row) => `${row.key}  (${row.count}x)`,
    ) +
    report(
      'Approved suppression(s) that grew beyond the agreed count:',
      grew,
      (row) =>
        `${row.key}  approved ${row.approvedCount}x, found ${row.count}x`,
    ) +
    report(
      `Stale register entr(ies) — the code is gone, so delete the approval from ${REGISTER_PATH}:`,
      stale,
      (row) => row.key,
    ) +
    report(
      'Register entr(ies) with no real reason or no reference:',
      undocumented,
      (row) => row.key,
    );

  if (failures > 0) {
    process.stdout.write(`\n${failures} problem(s).\n`);
    process.exitCode = 1;
    return;
  }
  const provisional = register.filter(
    (entry) => entry.status === 'provisional',
  ).length;
  process.stdout.write(
    `${packageDirs.length} public package(s): ${held.length} gated suppression(s), all approved and documented` +
      `${provisional > 0 ? ` (${provisional} still provisional)` : ''}. ` +
      `${found.length - held.length} repo-wide Biome rule(s) also reach them (ADR-035 §7).\n`,
  );
};

main();
