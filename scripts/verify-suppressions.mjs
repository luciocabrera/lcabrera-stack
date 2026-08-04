/**
 * Gate: the four public packages carry no suppression that has not been argued
 * for in writing (AGENTS.md §4).
 *
 * Findings are diffed against `docs/agents/public-package-suppressions.json` in
 * two lanes — `approved` (scoped to a public package) and `acknowledged`
 * (repo-wide policy that reaches one). Both are enforced; gating only the first
 * let a broad override reach a public package unlisted.
 *
 * Each lane fails on: a suppression with no entry, an entry that grew, an entry
 * matching nothing (anti-rot), one with no reason or reference, or one still
 * marked `provisional` — a deferred decision may live inside a PR, never in a
 * build.
 *
 * What is detected, and how to add an exception:
 * `docs/agents/public-package-suppressions.md` — the one copy of that table.
 *
 * Effects live here; the rules are pure in `./lib/suppressions.mjs`.
 *
 * Usage: node scripts/verify-suppressions.mjs [--list]
 *   --list  print every suppression found, approved or not, and exit 0
 */
import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import process from 'node:process';

import { publicPackageDirs } from './lib/coverage-workspaces.mjs';
import { parseJsonc } from './lib/jsonc.mjs';
import { readTextWithin } from './lib/safe-read.mjs';
import { findReactDoctorSuppressions } from './lib/suppressions-react-doctor.mjs';
import {
  diffAgainstRegister,
  findBiomeSuppressions,
  findConfigSuppressions,
  findFallowSuppressions,
  findInlineSuppressions,
  repoWide,
  tally,
  targeted,
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

  const readPublic = (file) => ({
    file,
    text: readTextWithin(join(REPO_ROOT, file), REPO_ROOT),
  });

  // Every workspace React Doctor could treat as its own project. It reports
  // paths relative to the project, so the detector needs these to recognise a
  // glob written without the `packages/ui/` prefix.
  //
  // Derived from the scanned paths, NOT by looking for `package.json`: `walk`
  // only yields source extensions, so a manifest-based version silently found
  // nothing and every project-relative glob went unmatched — the gate passed a
  // planted `packages/ui` suppression.
  const projectDirs = [
    ...new Set(
      allFiles.flatMap((path) => {
        const [, dir] = /^((?:apps|packages)\/[^/]+)\//u.exec(path) ?? [];
        return dir === undefined ? [] : [dir];
      }),
    ),
  ];

  const found = tally([
    ...publicFiles.flatMap((file) => findInlineSuppressions(readPublic(file))),
    ...publicFiles.flatMap((file) => findConfigSuppressions(readPublic(file))),
    ...findBiomeSuppressions({
      config: readJson('biome.jsonc'),
      otherFiles,
      publicFiles,
    }),
    ...findReactDoctorSuppressions({
      config: readJson('doctor.config.jsonc'),
      otherFiles,
      projectDirs,
      publicFiles,
    }),
    ...findFallowSuppressions({ baselines: readBaselines(), isPublicPath }),
  ]);

  const own = targeted(found);
  const inherited = repoWide(found);

  if (process.argv.includes('--list')) {
    for (const row of found)
      process.stdout.write(`${row.count}\t${row.scope}\t${row.key}\n`);
    process.stdout.write(
      `\n${found.length} suppression(s) reaching ${packageDirs.length} public package(s): ` +
        `${own.length} scoped to the packages themselves, ${inherited.length} from repo-wide policy. ` +
        `Both are held to a register.\n`,
    );
    return;
  }

  const register = readJson(REGISTER_PATH);
  // Two lists, one bar. `approved` is an exemption FOR a public package;
  // `acknowledged` is a repo-wide decision that happens to reach one. Both must
  // be listed, so no override can widen onto these packages unnoticed — the hole
  // the first version of this gate left open.
  const lanes = [
    {
      found: own,
      label: 'scoped to a public package',
      list: 'approved',
      register: register.approved ?? [],
    },
    {
      found: inherited,
      label: 'repo-wide, reaching a public package',
      list: 'acknowledged',
      register: register.acknowledged ?? [],
    },
  ];

  const failures = lanes.reduce((total, lane) => {
    const { grew, provisional, stale, unapproved, undocumented } =
      diffAgainstRegister(lane);
    return (
      total +
      report(
        `Unapproved suppression(s) ${lane.label} — fix the code, or add a justified entry to ${REGISTER_PATH} → ${lane.list}:`,
        unapproved,
        (row) => `${row.key}  (${row.count}x)`,
      ) +
      report(
        `Suppression(s) ${lane.label} that grew beyond the agreed count:`,
        grew,
        (row) =>
          `${row.key}  approved ${row.approvedCount}x, found ${row.count}x`,
      ) +
      report(
        `Stale entr(ies) in ${lane.list} — the code is gone, so delete the approval:`,
        stale,
        (row) => row.key,
      ) +
      report(
        `Entr(ies) in ${lane.list} with no real reason or no reference:`,
        undocumented,
        (row) => row.key,
      ) +
      report(
        `Provisional entr(ies) in ${lane.list} — a deferred decision cannot survive a build. ` +
          `Discharge each one: fix the finding and delete the entry, or restate it as ` +
          `"status": "permanent" with a reason naming why no fix exists in our control:`,
        provisional,
        (row) => row.key,
      )
    );
  }, 0);

  if (failures > 0) {
    process.stdout.write(`\n${failures} problem(s).\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(
    `${packageDirs.length} public package(s): ${own.length} scoped suppression(s), ` +
      `${inherited.length} inherited from repo-wide policy. All listed, documented and settled.\n`,
  );
};

main();
