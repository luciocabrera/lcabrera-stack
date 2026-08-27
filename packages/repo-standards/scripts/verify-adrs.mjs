#!/usr/bin/env node

/**
 * Fails the build when an ADR is in the wrong place, badly named, reuses a
 * number, or does not say what it decided and what it governs — and keeps each
 * home's index in step with its directory.
 *
 * Why this exists: nothing checked ADR placement at all. `docs:verify` skips
 * every `decisions` directory on purpose, because an ADR records a point in time
 * and its paths are allowed to go stale. So four homes accumulated, and a number
 * came to mean two different documents. The taxonomy is
 * docs/decisions/ADR-048-adr-taxonomy-and-one-sequence.md; this file is what
 * makes it hold.
 *
 * The gate then read only the filename, so a record with no context, no decision
 * and no consequences passed exactly like a complete one, and nothing said which
 * packages a decision constrained. `adr-content.mjs` is the reading of the
 * record; `adr-baseline.mjs` is the grandfathering of the ones written before
 * the block existed.
 *
 * Usage:
 *   repo-verify-adrs                     check; exit 1 on any violation
 *   repo-verify-adrs --write             prune the baseline, regenerate indexes
 *   repo-verify-adrs --adopt             write the baseline ONCE, on adoption
 *   repo-verify-adrs --list              print every ADR with its title
 *   repo-verify-adrs --list --package <workspace>
 *                                        print the decisions governing one
 *
 * `--list` is where the per-ADR table went: the committed index carries no row
 * per ADR, because that made every pair of concurrent ADR branches conflict
 * (ADR-075).
 *
 * Exit codes: 0 = clean, 1 = a violation, or an index that is out of date.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EMPTY_BASELINE,
  adoptedBaseline,
  baselineFindings,
  baselinedFiles,
  hasGrown,
  prunedBaseline,
  readableBaseline,
} from './adr-baseline.mjs';
import {
  REPOSITORY_SCOPE,
  adrBody,
  governedBy,
  recordFindings,
} from './adr-content.mjs';
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
  parseAdrFilename,
  renderGoverned,
  renderIndex,
  renderListing,
} from './adr-registry.mjs';
import { pad } from './adr-scaffold.mjs';
import { readRegisters } from './config.mjs';
import { resolveHostRoot } from './host-root.mjs';
import { deriveWorkspaceScopes } from './workspace-scopes.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const INDEX_FILE = 'README.md';

const BASELINE_REL = readRegisters(REPO_ROOT).adrContentBaseline;
const BASELINE_PATH = join(REPO_ROOT, BASELINE_REL);

/**
 * The workspace names a record's `governs` may hold, derived from
 * pnpm-workspace.yaml rather than declared — so a workspace added today is a
 * legal answer today. An empty roster is not treated as "allow anything": the
 * finding says the roster could not be derived, because a gate that accepts
 * every name when it can read none is a gate reporting a clean pass over
 * nothing.
 */
const WORKSPACES = deriveWorkspaceScopes(REPO_ROOT);

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

/**
 * One record, read once. The heading is taken from the BODY rather than from the
 * file: a `#` comment inside the block would otherwise be picked up as the H1,
 * and the number check would stop firing without saying so.
 */
const entryFor = (dir, filename) => {
  const markdown = readFileSync(join(REPO_ROOT, dir, filename), 'utf8');
  const body = adrBody(markdown);
  return {
    filename,
    governs: governedBy(markdown),
    headingNumber: headingNumber(body),
    markdown,
    number: parseAdrFilename(filename)?.number,
    title: headingTitle(body),
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

/** What every record says about itself, with where it lives, for the baseline
 *  arithmetic and for the findings alike. */
const recordsOf = (homes) =>
  homes.flatMap((home) =>
    home.entries.map((entry) => ({
      filename: entry.filename,
      findings: recordFindings({
        markdown: entry.markdown,
        workspaces: WORKSPACES,
      }),
      number: entry.number,
      path: `${home.dir}/${entry.filename}`,
    })),
  );

const readBaseline = () =>
  existsSync(BASELINE_PATH)
    ? readableBaseline(JSON.parse(readFileSync(BASELINE_PATH, 'utf8')))
    : EMPTY_BASELINE;

/** The directory is created rather than assumed: a repository adopting the gate
 *  need not already have one where the baseline is configured to live. */
const saveBaseline = (baseline) => {
  mkdirSync(dirname(BASELINE_PATH), { recursive: true });
  writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, undefined, 2)}\n`);
};

/**
 * A workspace called `repository` would make the two meanings of `governs`
 * indistinguishable. Reported once against the roster rather than per record,
 * because it is the roster that is wrong.
 */
const rosterFindings = () =>
  WORKSPACES.has(REPOSITORY_SCOPE)
    ? [
        `pnpm-workspace.yaml declares a workspace named \`${REPOSITORY_SCOPE}\`, which is the word \`governs\` uses for "no one workspace" — the two cannot be told apart`,
      ]
    : [];

/**
 * What the records themselves get wrong — everything `--write` cannot fix for
 * you, and so everything it must refuse on.
 *
 * Kept apart from the baseline's own findings because those two answer to
 * different commands. "Prune me" is a finding `--write` exists to act on, so
 * refusing on it would leave no command able to shrink the baseline; a record
 * with no `governs` block is a finding only its author can act on.
 */
const recordContentFindings = ({ baseline, records }) => {
  const grandfathered = baselinedFiles(baseline);
  return [
    ...rosterFindings(),
    ...records
      .filter((record) => !grandfathered.has(record.filename))
      .flatMap((record) =>
        record.findings.map((finding) => `${record.path} — ${finding}`),
      ),
  ];
};

const contentFindings = ({ baseline, records }) => [
  ...recordContentFindings({ baseline, records }),
  ...baselineFindings({ baseline, records }).map(
    (finding) => `${BASELINE_REL}: ${finding}`,
  ),
];

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

/**
 * Adoption, refused over a baseline that is already there.
 *
 * The refusal stops the reflex of re-running `--adopt` to make a failing run go
 * away. It is not a claim that nothing can grandfather afresh — deleting the
 * file first is an ordinary thing to be able to do. What holds either way is
 * `adr-baseline.mjs`'s bound: at most `maxEntries` records escape the content
 * rules, whatever wrote the list.
 */
const runAdopt = (records) => {
  if (existsSync(BASELINE_PATH)) {
    console.error(
      `${BASELINE_REL} already exists. Adoption happens once — prune it with --write as records are classified.`,
    );
    process.exitCode = 1;
    return;
  }
  const baseline = adoptedBaseline(records);
  saveBaseline(baseline);
  console.log(
    `Wrote ${BASELINE_REL}: ${baseline.files.length} record(s) grandfathered, and that is the most it may ever hold.`,
  );
};

/**
 * Prune-only. `--write` may drop an entry that no longer earns its place; it may
 * never absorb a new one.
 *
 * **It never exits 0 on a tree the plain run rejects.** This is the command the
 * gate NAMES — the staleness finding tells an author to run it, and
 * `registers.adrCommands.write` puts it in every generated index — so an author
 * who adds an unclassified record, is told the index is stale, runs the command
 * named and gets a clean exit has been told the record is fine, by the gate.
 *
 * It still does its work first, then reports: the index is regenerated and the
 * baseline pruned, and the record's own findings are printed with a non-zero
 * exit. Refusing to write instead would leave a stale index unfixable while any
 * record failed, which is a different job. `verify-docs-paths.mjs --write` splits
 * the same way, for the same reason.
 *
 * The exception is a STRUCTURAL finding — a malformed name, a stray — because
 * the index is generated from those names and would be written wrong. And a
 * baseline that has already grown is refused rather than rewritten: pruning it
 * would set the bound to whatever the grown list kept, which is exactly how a
 * hand-added entry would become a baseline the next run reports as clean.
 */
const runWrite = (homes, records) => {
  const baseline = readBaseline();
  const structural = adrFindings({
    drafts: listMarkdown(DRAFT_DIR),
    homes,
    strays: strayPaths(),
  });
  if (structural.length > 0) {
    report(structural, []);
    process.exitCode = 1;
    return;
  }

  if (hasGrown(baseline)) {
    report(
      baselineFindings({ baseline, records }).map(
        (finding) => `${BASELINE_REL}: ${finding}`,
      ),
      [],
    );
    process.exitCode = 1;
    return;
  }

  const pruned = prunedBaseline({ baseline, records });
  const dropped = baseline.files.length - pruned.files.length;
  // The bound is reported off its own comparison, not off `dropped`. A baseline
  // whose list was shortened by hand has slack in it, so a run that prunes
  // nothing still tightens the bound — and saying "unchanged" while rewriting
  // the file is the one thing a gate's output must not do.
  const tightened = pruned.maxEntries !== baseline.maxEntries;
  if (existsSync(BASELINE_PATH)) {
    saveBaseline(pruned);
    console.log(
      dropped === 0 && !tightened
        ? `${BASELINE_REL} unchanged — every grandfathered record still needs it.`
        : `${BASELINE_REL} rewritten: ${dropped} record(s) no longer need grandfathering; it may now hold at most ${pruned.maxEntries}.`,
    );
  }
  writeIndexes(homes);

  // Everything this command cannot fix for the author, after everything it can.
  const remaining = recordContentFindings({ baseline: pruned, records });
  if (remaining.length > 0) {
    report(remaining, []);
    process.exitCode = 1;
  }
};

/**
 * `--package <name>` — `undefined` when the flag is absent, the empty string
 * when it is there with nothing usable after it. (pure)
 *
 * The two are different answers and must not collapse: reading a missing name as
 * "no filter" prints every record under no heading, which answers a question the
 * reader did not ask. A following `--flag` is treated as missing for the same
 * reason, since `--package --write` names no workspace either.
 */
const packageArg = (argv) => {
  const at = argv.indexOf('--package');
  if (at === -1) {
    return undefined;
  }
  const value = argv[at + 1];
  return value === undefined || value.startsWith('--') ? '' : value;
};

/**
 * How many records the listing cannot see.
 *
 * Printed under the tables because an empty one is ambiguous otherwise: "no
 * decision governs this package" and "every decision predates the block" read
 * the same, and only one of them is a fact about the package.
 */
const unclassifiedCount = (homes) =>
  homes.reduce(
    (count, home) =>
      count + home.entries.filter((entry) => entry.governs.length === 0).length,
    0,
  );

const runList = (homes) => {
  const workspace = packageArg(process.argv);
  if (workspace === undefined) {
    console.log(renderListing(homes));
    return;
  }
  if (workspace === '') {
    console.error(
      '--package needs a workspace directory name after it. Listing everything for a filter that named nothing would answer a question you did not ask.',
    );
    process.exitCode = 1;
    return;
  }
  if (!WORKSPACES.has(workspace)) {
    console.error(
      `--package: \`${workspace}\` is no workspace in this repository (${[...WORKSPACES].toSorted((left, right) => left.localeCompare(right)).join(', ')}). A name nothing answers to would list nothing and read as "no decisions govern it".`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(renderGoverned({ homes, workspace }));

  const unclassified = unclassifiedCount(homes);
  if (unclassified > 0) {
    console.log(
      `_${unclassified} record(s) carry no \`governs\` block, appear in neither table, and are grandfathered in ${BASELINE_REL}._`,
    );
  }
};

const main = () => {
  const homes = readHomes();
  const records = recordsOf(homes);

  if (process.argv.includes('--list')) {
    runList(homes);
    return;
  }

  if (process.argv.includes('--adopt')) {
    runAdopt(records);
    return;
  }

  if (process.argv.includes('--write')) {
    runWrite(homes, records);
    return;
  }

  const baseline = readBaseline();
  const findings = [
    ...adrFindings({
      drafts: listMarkdown(DRAFT_DIR),
      homes,
      strays: strayPaths(),
    }),
    ...contentFindings({ baseline, records }),
  ];
  const stale = staleIndexes(homes);
  if (findings.length > 0 || stale.length > 0) {
    report(findings, stale);
    process.exitCode = 1;
    return;
  }

  const total = homes.reduce((count, home) => count + home.entries.length, 0);
  console.log(
    `ADR gate passed: ${total} ADR(s) across ${homes.length} home(s); next free number is ADR-${pad(nextFreeNumber(homes))}.`,
  );
  console.log(
    `${baseline.files.length} record(s) predate the metadata block and are grandfathered in ${BASELINE_REL}, which may hold at most ${baseline.maxEntries}; they are unclassified and \`--list --package\` cannot see them. Exemptions are keyed on filename, so that list pins how many records escape these rules, not which — review the records too.`,
  );
  console.log(
    'Not checked, and not checkable here: whether a section says anything true — only that it is present and not empty.',
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
