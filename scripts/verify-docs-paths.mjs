/**
 * Fails the build when a document names a repository path that does not exist.
 *
 * Why this exists: `commands:verify` polices COMMANDS.md, `coordination:verify`
 * the task register, `scripts:verify` script size — but the ~250 other tracked
 * markdown files were unchecked, and they rot silently. A single audit (#171)
 * corrected 30 files and deleted 2 whole documents describing directories that
 * held nothing but themselves; AGENTS.md, the file every agent reads first,
 * listed 10 app directories of which 6 did not exist. Every extraction or
 * rename invalidates another set, and nothing notices.
 *
 * The hard part is precision, not detection. A naive "resolve every backticked
 * token" pass yields roughly ten times more noise than signal — teaching
 * examples, suffix conventions, framework docs, forward-looking specs — and a
 * gate that cries wolf gets bypassed. So the classification rules live in
 * `lib/docs-paths.mjs`, a token must look like a path and survive those filters,
 * and it is resolved against the doc's own directory and its workspace before
 * the repo root, because a doc pointing at a sibling or a cross-package file is
 * correct in context.
 *
 * Inherited breakage is grandfathered in `scripts/docs-paths-baseline.json` so
 * the gate can land without a cleanup blocking it. The baseline may SHRINK
 * freely and may only GROW one reference at a time, with a stated reason —
 * `--write` can no longer absorb a new failure. See `lib/docs-paths-baseline.mjs`
 * for why the hatches are this narrow; the short version is that the first cut
 * offered only all-or-nothing exemptions, and four of the five references it
 * grandfathered turned out to be real broken links rather than illustrations.
 *
 * Usage:
 *   node scripts/verify-docs-paths.mjs            check, exit 1 on new breakage
 *   node scripts/verify-docs-paths.mjs --write    prune entries that now resolve
 *   node scripts/verify-docs-paths.mjs --accept <doc> <ref> --reason "<why>"
 *                                                 grandfather ONE reference
 *
 * Exit codes: 0 = clean or baselined, 1 = a document names a missing path.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  isBaselined,
  prunedBaseline,
  prunedCount,
  sortBaseline,
  withAccepted,
} from './lib/docs-paths-baseline.mjs';
import {
  extractCandidates,
  isRootAnchored,
  parseWorkspaceSpecifier,
} from './lib/docs-paths.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const BASELINE_PATH = join(REPO_ROOT, 'scripts', 'docs-paths-baseline.json');

/** Documents whose paths are illustrative or forward-looking by design. */
const IGNORED_DOCS = [
  'CHANGELOG.md',
  'reports/',
  '/decisions/', // ADRs record a decision at a point in time
  'docs/cqms/PRD',
  'docs/cqms/TECH_SPEC',
  'docs/cqms/IMPLEMENTATION_PLAN',
  'docs/coordination/PLAN_TRIAGE.md',
  '_PLAN.md', // approved-but-unbuilt specs name files that do not exist yet
  '.github/skills/react-router-framework-mode/', // upstream framework docs
  // Architecture *templates* — they describe a shape to copy, so their paths
  // are illustrative by construction.
  '.github/skills/store-pattern/references/architecture-templates/',
  'node_modules/',
];

const isIgnoredDoc = (docPath) =>
  IGNORED_DOCS.some((fragment) => docPath.includes(fragment));

/** Directories that never contain governed documentation. */
const SKIPPED_DIRS = new Set([
  '.git',
  '.react-router',
  '.tmp',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

/**
 * Whether this directory is a *separate checkout of the repo* rather than part
 * of this one — a linked worktree (where `.git` is a file) or a nested clone
 * (where it is a directory). Both are visible to the `readdirSync` the walk
 * already performs, so this costs nothing and needs no subprocess.
 *
 * Descending into one scans every document a second time and resolves its
 * relative references against THIS root, so a doc that is correct in its own
 * tree gets reported broken here. `coordination:claim --worktree` — which
 * AGENTS.md recommends whenever other agents are active — puts a full linked
 * checkout under `.claude/worktrees/<id>`, and because that path is gitignored,
 * CI's fresh checkout never has one: the gate failed only on the machine that
 * ran the recommended command, and the only way past it was `--no-verify`. A
 * gate that fires locally and nowhere else trains people to bypass the pre-push
 * hook, which then stops catching everything else it guards.
 *
 * Matched by "is a checkout" rather than "is gitignored" deliberately. Reading
 * `.gitignore` would cover this case too, but root-only is incomplete (this repo
 * has nine nested gitignore files) and gitignore lines are patterns, not names —
 * a naive reader risks skipping a directory of real documents, and the symptom
 * of that is the gate quietly checking less. Silent loss of coverage is the
 * failure this whole file exists to prevent.
 */
const isSeparateCheckout = (entries, prefix) =>
  prefix !== '' && entries.some((entry) => entry.name === '.git');

/**
 * Every markdown file under the repo, found by walking rather than by shelling
 * out to `git ls-files`: these scripts launch no subprocess, so a PATH-resolved
 * process can never be substituted underneath a gate that runs on every push.
 */
const walkMarkdown = (dir, prefix = '') => {
  const entries = readdirSync(dir, { withFileTypes: true });
  if (isSeparateCheckout(entries, prefix)) {
    return [];
  }
  return entries.flatMap((entry) => {
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name)
        ? []
        : walkMarkdown(join(dir, entry.name), relativePath);
    }
    return entry.name.endsWith('.md') ? [relativePath] : [];
  });
};

const documentedFiles = () =>
  walkMarkdown(REPO_ROOT).filter((docPath) => !isIgnoredDoc(docPath));

/**
 * Paths that are generated or local-only and therefore *expected* to be absent
 * from a fresh checkout — documenting them is correct, not a broken link. Kept
 * as an explicit list so the exemptions are reviewable in one place. (Asking
 * `git check-ignore` would be more general but needs a subprocess, and it
 * disagrees with CI for anything ignored via a developer's *global* gitignore.)
 */
const GENERATED_OR_LOCAL = new Set([
  '.claude/settings.local.json',
  'docs/coordination/BOARD.md',
  'reports/fallow/coverage/coverage-final.json',
]);

/** Report directories whose contents are produced on demand (ADR-049). */
const ON_DEMAND_REPORT_DIRS = new Set([
  'biome',
  'eslint',
  'fallow',
  'oxlint',
  'skills',
  'sonar',
]);

/**
 * A findings report produced on demand. Documenting the path is correct — that is
 * where the command writes — but a fresh checkout has none of them, so resolving
 * one would fail everywhere except a machine that has just run the tool.
 *
 * Matched at exactly one level below the tool directory, which is what keeps the
 * tracked gate BASELINES out of the exemption: `reports/fallow/baselines/…` is a
 * level deeper, so a doc naming a missing baseline is still a real broken link.
 */
const isOnDemandReport = (token) => {
  const parts = token.split('/');
  return (
    (parts.length === 3 &&
      parts[0] === 'reports' &&
      ON_DEMAND_REPORT_DIRS.has(parts[1])) ||
    token.startsWith('reports/sonar/runs/')
  );
};

const isExpectedAbsent = (token) =>
  GENERATED_OR_LOCAL.has(token) ||
  isOnDemandReport(token) ||
  token.startsWith('docker/local/') ||
  token.startsWith('reports/fallow/runs/');

/** The workspace directory owning a doc, if any (apps/x or packages/x). */
const workspaceOf = (docPath) => {
  const match = /^((?:apps|packages)\/[^/]+)\//.exec(docPath);
  return match === null ? undefined : join(REPO_ROOT, match[1]);
};

/** A `@repo/pkg/sub` specifier resolves through that package's exports map. */
const workspaceSpecifierExists = (token) => {
  const parsed = parseWorkspaceSpecifier(token);
  if (parsed === undefined) {
    return undefined;
  }
  const manifest = join(
    REPO_ROOT,
    'packages',
    parsed.packageName,
    'package.json',
  );
  if (!existsSync(manifest)) {
    return false;
  }
  if (parsed.subpath === undefined) {
    return true;
  }
  const exported = JSON.parse(readFileSync(manifest, 'utf8')).exports ?? {};
  const keys = Object.keys(exported);
  return keys.some((key) => {
    const pattern = key.replace(/^\.\/?/, '');
    return pattern.includes('*')
      ? new RegExp(`^${pattern.replaceAll('*', '.*')}$`).test(parsed.subpath)
      : pattern === parsed.subpath;
  });
};

/**
 * Root-anchored tokens resolve from the repo root. A relative markdown link
 * resolves from the document's own directory. A doc may also point at a file
 * inside its own workspace, so that root is tried too.
 */
const resolvesSomewhere = (token, docPath) => {
  const viaWorkspace = workspaceSpecifierExists(token);
  if (viaWorkspace !== undefined) {
    return viaWorkspace;
  }
  const roots = isRootAnchored(token)
    ? [REPO_ROOT, workspaceOf(docPath)]
    : [join(REPO_ROOT, dirname(docPath)), workspaceOf(docPath), REPO_ROOT];
  return roots
    .filter((root) => root !== undefined)
    .some((root) => existsSync(join(root, token)));
};

const findingsFor = (docPath) => {
  const markdown = readFileSync(join(REPO_ROOT, docPath), 'utf8');
  const unique = [...new Set(extractCandidates(markdown))];
  return unique
    .filter((token) => !resolvesSomewhere(token, docPath))
    .map((token) => ({ doc: docPath, token }));
};

const readBaseline = () =>
  existsSync(BASELINE_PATH)
    ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
    : {};

const saveBaseline = (baseline) =>
  writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(sortBaseline(baseline), undefined, 2)}\n`,
  );

/** `--accept <doc> <reference> --reason "<why>"`, or undefined. (pure) */
const parseAccept = (argv) => {
  const at = argv.indexOf('--accept');
  if (at === -1) {
    return undefined;
  }
  const reasonAt = argv.indexOf('--reason');
  return {
    doc: argv[at + 1],
    reason: reasonAt === -1 ? undefined : argv[reasonAt + 1],
    token: argv[at + 2],
  };
};

/**
 * Grandfather exactly one reference. Refuses anything that is not currently
 * failing: an entry for a reference that already resolves is either a typo or a
 * pre-emptive exemption, and both rot into "why is this here?" lines that nobody
 * dares delete.
 */
const runAccept = (accept, findings, baseline) => {
  const { doc, reason, token } = accept;
  if (doc === undefined || token === undefined || reason === undefined) {
    console.error(
      'Usage: --accept <doc> <reference> --reason "why this path is illustrative"',
    );
    process.exitCode = 1;
    return;
  }

  const isFailing = findings.some(
    (finding) => finding.doc === doc && finding.token === token,
  );
  if (!isFailing) {
    console.error(
      `Not a current finding: ${doc} \`${token}\`. Only a reference the gate actually reports can be grandfathered.`,
    );
    process.exitCode = 1;
    return;
  }

  saveBaseline(withAccepted(baseline, { doc, reason, token }));
  console.log(`Grandfathered ${doc} \`${token}\` — ${reason}`);
};

/**
 * Prune-only. `--write` may drop entries that now resolve; it may never absorb a
 * new failure, which is what made the old rebaseline a one-keystroke way to make
 * real breakage disappear.
 */
const runWrite = (findings, baseline) => {
  const dropped = prunedCount(baseline, findings);
  saveBaseline(prunedBaseline(baseline, findings));
  console.log(
    dropped === 0
      ? 'Documented-path baseline unchanged — every grandfathered reference still fails.'
      : `Documented-path baseline pruned: ${dropped} reference(s) now resolve.`,
  );

  const unbaselined = findings.filter(
    (finding) => !isBaselined(baseline, finding.doc, finding.token),
  );
  if (unbaselined.length > 0) {
    console.error(
      `\n${unbaselined.length} failing reference(s) were NOT added — fix them, or grandfather each with --accept.`,
    );
    process.exitCode = 1;
  }
};

const reportIntroduced = (introduced) => {
  console.error(
    `Documented-path gate — ${introduced.length} reference(s) that do not resolve:\n`,
  );
  for (const finding of introduced) {
    console.error(`  - ${finding.doc}: \`${finding.token}\``);
  }
  console.error(
    '\nFix the path, or delete the claim. A documented path nobody checks becomes false.',
  );
  console.error(
    'Genuinely illustrative? Grandfather that ONE reference, with its reason:',
  );
  const [first] = introduced;
  console.error(
    `  node scripts/verify-docs-paths.mjs --accept ${first.doc} ${first.token} --reason "..."`,
  );
};

const main = () => {
  const findings = documentedFiles()
    .flatMap((doc) => findingsFor(doc))
    .filter((finding) => !isExpectedAbsent(finding.token));
  const baseline = readBaseline();

  const accept = parseAccept(process.argv);
  if (accept !== undefined) {
    runAccept(accept, findings, baseline);
    return;
  }

  if (process.argv.includes('--write')) {
    runWrite(findings, baseline);
    return;
  }

  const introduced = findings.filter(
    (finding) => !isBaselined(baseline, finding.doc, finding.token),
  );

  if (introduced.length > 0) {
    reportIntroduced(introduced);
    process.exitCode = 1;
    return;
  }

  const grandfathered = Object.values(baseline).flatMap(Object.keys).length;
  console.log(
    `Documented-path gate passed: ${documentedFiles().length} doc(s) checked, ${grandfathered} grandfathered.`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
