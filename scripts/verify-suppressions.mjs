/**
 * Gate: the four public packages carry no suppression that has not been argued
 * for in writing.
 *
 * AGENTS.md §4 holds `packages/ui`, `api`, `server` and `utils` to "every
 * finding gets fixed, never baselined or disabled". That was enforced for the
 * eslint baseline alone (gitignored, so CI has nothing to check out) and for
 * nothing else — the claim was false about `packages/ui` on the day it was
 * written. This makes the remaining mechanisms checkable too; the table of what
 * is detected lives in `docs/agents/public-package-suppressions.md`, not here,
 * so there is one copy to keep true.
 *
 * The register is `docs/agents/public-package-suppressions.json`. It lives in
 * docs/, not next to this script, on purpose: it is a policy document whose
 * diff is the review, not a build artifact. It is deliberately NOT called a
 * baseline — a baseline is a thing you stop reading.
 *
 * Two lanes, both enforced. `approved` is a suppression scoped to a public
 * package; `acknowledged` is repo-wide policy (ADR-035 §7) that happens to reach
 * one. An earlier version gated only the first and merely reported the second,
 * which left a hole: an override broad enough to match a public package AND
 * anything else needed no entry and passed silently.
 *
 * Each lane fails on four conditions:
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

/**
 * Index just past the string literal opening at `start`.
 *
 * Skips the character after a backslash so an escaped quote does not end the
 * literal early — which would put the scanner back in "code" mode mid-string and
 * let the rest of the line be read as syntax.
 */
const endOfString = (text, start) => {
  for (let index = start + 1; index < text.length; index += 1) {
    if (text[index] === '\\') index += 1;
    else if (text[index] === '"') return index + 1;
  }
  return text.length;
};

/** Index of the newline ending the line comment at `start`, or end of text. */
const endOfLineComment = (text, start) => {
  const newline = text.indexOf('\n', start);
  return newline === -1 ? text.length : newline;
};

/**
 * Strips `//` line comments, leaving string literals untouched.
 *
 * String-aware by necessity: `biome.jsonc`'s own `$schema` value contains `//`,
 * and a naive strip truncates the document into invalid JSON. Biome itself fails
 * silently on a config parse error (AGENTS.md §4), so this must not — a config
 * that silently reads as `{}` would report every public package clean.
 *
 * Written as a scan over literals rather than a per-character state machine: the
 * flag-juggling version was correct but scored cognitive complexity 17, and
 * "skip to the end of this construct" is what the code actually means.
 */
const stripJsoncComments = (text) => {
  let out = '';
  let index = 0;
  while (index < text.length) {
    if (text[index] === '"') {
      const end = endOfString(text, index);
      out += text.slice(index, end);
      index = end;
    } else if (text[index] === '/' && text[index + 1] === '/') {
      index = endOfLineComment(text, index);
    } else {
      out += text[index];
      index += 1;
    }
  }
  return out;
};

/** Parses JSONC — JSON plus `//` comments and trailing commas. */
const parseJsonc = (text) =>
  JSON.parse(stripJsoncComments(text).replaceAll(/,(?=\s*[}\]])/gu, ''));

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

  const found = tally([
    ...publicFiles.flatMap((file) => findInlineSuppressions(readPublic(file))),
    ...publicFiles.flatMap((file) => findConfigSuppressions(readPublic(file))),
    ...findBiomeSuppressions({
      config: readJson('biome.jsonc'),
      otherFiles,
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
    const { grew, stale, unapproved, undocumented } = diffAgainstRegister(lane);
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
      )
    );
  }, 0);

  if (failures > 0) {
    process.stdout.write(`\n${failures} problem(s).\n`);
    process.exitCode = 1;
    return;
  }
  const provisional = (register.approved ?? []).filter(
    (entry) => entry.status === 'provisional',
  ).length;
  // Named rather than inlined: a conditional template inside a template is
  // unreadable at a glance and Sonar rejects the nesting (S4624).
  const pending = provisional > 0 ? ` (${provisional} still provisional)` : '';
  process.stdout.write(
    `${packageDirs.length} public package(s): ${own.length} scoped suppression(s)${pending}, ` +
      `${inherited.length} inherited from repo-wide policy. All listed and documented.\n`,
  );
};

main();
