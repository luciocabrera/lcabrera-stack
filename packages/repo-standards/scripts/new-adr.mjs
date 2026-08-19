/**
 * Scaffolds a new ADR: next free number, the home you name, the shape in
 * `docs/decisions/_TEMPLATE.md`.
 *
 * Why: the two things a new ADR gets wrong are its number and its home. Both are
 * decided by rules `adr:verify` already knows (ADR-048), so asking an author to
 * read them out of the gate's output and retype them is how a duplicate number
 * gets created — which is exactly what ADR-048 was written to stop.
 *
 * Usage:
 *   repo-adr "<title>" [--home <tier>] [--slug <slug>]
 *   repo-adr "<title>" --dry-run
 *
 * Exit codes: 0 = written, 1 = bad arguments, an occupied path, or a template
 * that no longer has a heading to fill in.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ADR_HOMES,
  NON_ADR_FILES,
  TEMPLATE_FILE,
  TEMPLATE_HOME,
  nextFreeNumber,
} from './adr-registry.mjs';
import {
  adrFilename,
  pad,
  renderAdr,
  resolveHome,
  slugify,
} from './adr-scaffold.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

const TIERS = ADR_HOMES.map((home) => home.tier);

const USAGE = `usage: repo-adr "<title>" [--home ${TIERS.join('|')}] [--slug <slug>] [--dry-run]`;

/** Argument parsing kept explicit rather than pulled from a library: this runs
 *  before install in a fresh worktree often enough to be worth the lines. */
const parseArgs = (argv) => {
  const options = { dryRun: false, home: 'repo', slug: '', title: '' };
  // `--` is how `vp run` ends its own options; it carries no meaning here.
  const rest = argv.filter((arg) => arg !== '--');
  while (rest.length > 0) {
    const arg = rest.shift();
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--home') {
      options.home = rest.shift() ?? '';
    } else if (arg === '--slug') {
      options.slug = rest.shift() ?? '';
    } else if (arg.startsWith('--')) {
      throw new Error(`unknown flag: ${arg}\n${USAGE}`);
    } else if (options.title === '') {
      options.title = arg;
    } else {
      throw new Error(`unexpected argument: ${arg}\n${USAGE}`);
    }
  }
  return options;
};

const readEntries = (dir) => {
  const absolute = join(REPO_ROOT, dir);
  return existsSync(absolute)
    ? readdirSync(absolute)
        .filter((name) => name.endsWith('.md') && !NON_ADR_FILES.has(name))
        .map((filename) => ({ filename }))
    : [];
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  if (options.title === '') {
    throw new Error(USAGE);
  }

  const home = resolveHome(ADR_HOMES, options.home);
  if (home === undefined) {
    throw new Error(`unknown home: ${options.home}\n${USAGE}`);
  }

  const slug = options.slug === '' ? slugify(options.title) : options.slug;
  if (slug === '') {
    throw new Error(
      `"${options.title}" has no ASCII words to build a slug from — pass --slug`,
    );
  }

  const number = nextFreeNumber(
    ADR_HOMES.map((each) => ({ ...each, entries: readEntries(each.dir) })),
  );
  const filename = adrFilename(number, slug);
  const path = join(home.dir, filename);
  if (existsSync(join(REPO_ROOT, path))) {
    throw new Error(`${path} already exists`);
  }

  const contents = renderAdr({
    number,
    template: readFileSync(
      join(REPO_ROOT, TEMPLATE_HOME, TEMPLATE_FILE),
      'utf8',
    ),
    title: options.title,
  });

  if (options.dryRun) {
    console.log(`would write ${path}\n`);
    console.log(contents);
    return;
  }

  writeFileSync(join(REPO_ROOT, path), contents);
  console.log(
    `Wrote ${path} as ADR-${pad(number)}.\nNext: fill in the sections, then run \`vp run adr:verify\`. The file is the whole change — the home's index carries no row per ADR, so nothing else moves (ADR-075).`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
