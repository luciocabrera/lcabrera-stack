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
  commandsFor,
  headingNumber,
  headingTitle,
  looksLikeAdr,
  nextFreeNumber,
  normalizeIndex,
  renderGoverned,
  renderIndex,
  renderListing,
} from './adr-registry.mjs';
import { pad } from './adr-scaffold.mjs';
import { CONFIG_FILE_NAME, readRegisters } from './config.mjs';
import { resolveHostRoot } from './host-root.mjs';
import { deriveWorkspaceScopes } from './workspace-scopes.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const INDEX_FILE = 'README.md';

const BASELINE_REL = readRegisters(REPO_ROOT).adrContentBaseline;
const BASELINE_PATH = join(REPO_ROOT, BASELINE_REL);

const WORKSPACES = deriveWorkspaceScopes(REPO_ROOT);

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
  const body = adrBody(markdown);
  return {
    filename,
    governs: governedBy(markdown),
    headingNumber: headingNumber(body),
    markdown,
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

const recordsOf = (homes) =>
  homes.flatMap((home) =>
    home.entries.map((entry) => ({
      filename: entry.filename,
      findings: recordFindings({
        markdown: entry.markdown,
        workspaces: WORKSPACES,
      }),
      path: `${home.dir}/${entry.filename}`,
    })),
  );

const readBaseline = () =>
  existsSync(BASELINE_PATH)
    ? readableBaseline(JSON.parse(readFileSync(BASELINE_PATH, 'utf8')))
    : EMPTY_BASELINE;

const saveBaseline = (baseline) => {
  mkdirSync(dirname(BASELINE_PATH), { recursive: true });
  writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, undefined, 2)}\n`);
};

const rosterFindings = () =>
  WORKSPACES.has(REPOSITORY_SCOPE)
    ? [
        `pnpm-workspace.yaml declares a workspace named \`${REPOSITORY_SCOPE}\`, which is the word \`governs\` uses for "no one workspace" — the two cannot be told apart`,
      ]
    : [];

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
      `  - ${home.dir}/${INDEX_FILE} is out of date — run \`${commandsFor(home).write}\``,
    );
  }
  console.error(
    `\nEvery ADR lives in one of the declared homes and takes the next free number, and one number names one ADR across all of them. The homes are \`registers.adrHomes\` in ${CONFIG_FILE_NAME}.`,
  );
};

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
    `Wrote ${BASELINE_REL}: ${baseline.files.length} record(s) grandfathered. From here the gate refuses a longer list, and --adopt refuses to overwrite this file while it is there.`,
  );
};

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

  const remaining = recordContentFindings({ baseline: pruned, records });
  if (remaining.length > 0) {
    report(remaining, []);
    process.exitCode = 1;
  }
};

const PACKAGE_FLAG = '--package';

const packageArg = (argv) => {
  const at = argv.findIndex(
    (arg) => arg === PACKAGE_FLAG || arg.startsWith(`${PACKAGE_FLAG}=`),
  );
  if (at === -1) {
    return undefined;
  }
  if (argv[at] !== PACKAGE_FLAG) {
    return argv[at].slice(PACKAGE_FLAG.length + 1);
  }
  const value = argv[at + 1];
  return value === undefined || value.startsWith('--') ? '' : value;
};

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
    `${baseline.files.length} record(s) are grandfathered in ${BASELINE_REL} and exempt from the content rules; ${unclassifiedCount(homes)} carry no \`governs\` block, so \`--list --package\` cannot see those. A record can be in one set and not the other.`,
  );
  console.log(
    'Exemptions are keyed on filename, so that list pins how many records escape these rules, not which — review the records too.',
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
