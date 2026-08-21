#!/usr/bin/env node

/**
 * Fails the build when an ADR is in the wrong place, badly named, or reuses a
 * number — and keeps each home's index in step with its directory.
 *
 * Why this exists: nothing checked ADR placement at all. `docs:verify` skips
 * every `decisions` directory on purpose, because an ADR records a point in time
 * and its paths are allowed to go stale. So four homes accumulated, and a number
 * came to mean two different documents. The taxonomy is
 * docs/decisions/ADR-048-adr-taxonomy-and-one-sequence.md; this file is what
 * makes it hold.
 *
 * Usage:
 *   repo-verify-adrs           check; exit 1 on any violation
 *   repo-verify-adrs --write   regenerate each home's README index
 *   repo-verify-adrs --list    print every ADR with its title
 *
 * `--list` is where the per-ADR table went: the committed index carries no row
 * per ADR, because that made every pair of concurrent ADR branches conflict
 * (ADR-075).
 *
 * Exit codes: 0 = clean, 1 = a violation, or an index that is out of date.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ADR_HOMES,
  DRAFT_DIR,
  NON_ADR_FILES,
  adrFindings,
  headingNumber,
  headingTitle,
  looksLikeAdr,
  nextFreeNumber,
  normalizeIndex,
  renderIndex,
  renderListing,
} from './adr-registry.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const INDEX_FILE = 'README.md';

/** Directories that never hold governed documentation. */
const SKIPPED_DIRS = new Set([
  '.git',
  '.react-router',
  '.tmp',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

const listMarkdown = (dir) => {
  const absolute = join(REPO_ROOT, dir);
  return existsSync(absolute)
    ? readdirSync(absolute).filter((name) => name.endsWith('.md'))
    : [];
};

const entryFor = (dir, filename) => {
  const markdown = readFileSync(join(REPO_ROOT, dir, filename), 'utf8');
  return {
    filename,
    headingNumber: headingNumber(markdown),
    title: headingTitle(markdown),
  };
};

const readHomes = () =>
  ADR_HOMES.map((home) => ({
    ...home,
    entries: listMarkdown(home.dir)
      .filter((filename) => !NON_ADR_FILES.has(filename))
      .map((filename) => entryFor(home.dir, filename)),
  }));

/**
 * Every `ADR-*.md` anywhere in the tree that is not in a declared home and not a
 * draft. Walked rather than globbed so a new directory is caught the day it
 * appears, which is the failure mode this whole file exists for: the four homes
 * were each reasonable in isolation and nothing ever compared them.
 *
 * A linked worktree or nested clone is skipped — descending into one reports
 * that checkout's files as strays in this one.
 */
const walkStrays = (dir, prefix = '') => {
  const entries = readdirSync(dir, { withFileTypes: true });
  if (prefix !== '' && entries.some((entry) => entry.name === '.git')) {
    return [];
  }
  return entries.flatMap((entry) => {
    const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name)
        ? []
        : walkStrays(join(dir, entry.name), path);
    }
    return looksLikeAdr(entry.name) && entry.name.endsWith('.md') ? [path] : [];
  });
};

const KNOWN_DIRS = new Set([...ADR_HOMES.map((home) => home.dir), DRAFT_DIR]);

const strayPaths = () =>
  walkStrays(REPO_ROOT).filter(
    (path) => !KNOWN_DIRS.has(path.slice(0, path.lastIndexOf('/'))),
  );

/**
 * Homes whose committed index no longer says what the directory says. Compared
 * through `normalizeIndex`, because Oxfmt reformats these files after they are
 * generated and a byte comparison would loop forever against it.
 */
const staleIndexes = (homes) =>
  homes.filter((home) => {
    const path = join(REPO_ROOT, home.dir, INDEX_FILE);
    return (
      !existsSync(path) ||
      normalizeIndex(readFileSync(path, 'utf8')) !==
        normalizeIndex(renderIndex(home))
    );
  });

const writeIndexes = (homes) => {
  const stale = staleIndexes(homes);
  for (const home of stale) {
    writeFileSync(join(REPO_ROOT, home.dir, INDEX_FILE), renderIndex(home));
  }
  console.log(
    stale.length === 0
      ? 'ADR indexes already match their directories.'
      : `Regenerated ${stale.length} ADR index/indexes: ${stale.map((home) => home.dir).join(', ')}.`,
  );
};

const report = (findings, stale) => {
  console.error(`ADR gate — ${findings.length + stale.length} violation(s):\n`);
  for (const finding of findings) {
    console.error(`  - ${finding}`);
  }
  for (const home of stale) {
    console.error(
      `  - ${home.dir}/${INDEX_FILE} is out of date — run \`vp run adr:verify -- --write\``,
    );
  }
  console.error(
    '\nThe taxonomy is docs/decisions/ADR-048-adr-taxonomy-and-one-sequence.md.',
  );
};

const main = () => {
  const homes = readHomes();

  if (process.argv.includes('--list')) {
    console.log(renderListing(homes));
    return;
  }

  const findings = adrFindings({
    drafts: listMarkdown(DRAFT_DIR),
    homes,
    strays: strayPaths(),
  });

  if (process.argv.includes('--write')) {
    if (findings.length > 0) {
      report(findings, []);
      process.exitCode = 1;
      return;
    }
    writeIndexes(homes);
    return;
  }

  const stale = staleIndexes(homes);
  if (findings.length > 0 || stale.length > 0) {
    report(findings, stale);
    process.exitCode = 1;
    return;
  }

  const total = homes.reduce((count, home) => count + home.entries.length, 0);
  console.log(
    `ADR gate passed: ${total} ADR(s) across ${homes.length} home(s); next free number is ADR-${String(nextFreeNumber(homes)).padStart(3, '0')}.`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
