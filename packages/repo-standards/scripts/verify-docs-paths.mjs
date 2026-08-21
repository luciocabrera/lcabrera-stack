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
 * `./docs-paths.mjs`, a token must look like a path and survive those filters,
 * and it is resolved against the doc's own directory and its workspace before
 * the repo root, because a doc pointing at a sibling or a cross-package file is
 * correct in context.
 *
 * Inherited breakage is grandfathered in `scripts/docs-paths-baseline.json` so
 * the gate can land without a cleanup blocking it. The baseline may SHRINK
 * freely and may only GROW one reference at a time, with a stated reason —
 * `--write` can no longer absorb a new failure. See `./docs-paths-baseline.mjs`
 * for why the hatches are this narrow; the short version is that the first cut
 * offered only all-or-nothing exemptions, and four of the five references it
 * grandfathered turned out to be real broken links rather than illustrations.
 *
 * Usage:
 *   repo-verify-docs-paths            check, exit 1 on new breakage
 *   repo-verify-docs-paths --write    prune entries that now resolve
 *   repo-verify-docs-paths --accept <doc> <ref> --reason "<why>"
 *                                     grandfather ONE reference
 *
 * Exit codes: 0 = clean or baselined, 1 = a document names a missing path.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readGates, readPublishing } from './config.mjs';
import {
  isBaselined,
  prunedBaseline,
  prunedCount,
  sortBaseline,
  withAccepted,
} from './docs-paths-baseline.mjs';
import {
  enforcedTokens,
  extractCandidates,
  isRootAnchored,
} from './docs-paths.mjs';
import { resolveHostRoot } from './host-root.mjs';
import { documentedFiles } from './markdown-corpus.mjs';
import { ALWAYS_SKIPPED } from './script-size.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const GATES = readGates(REPO_ROOT).docsPaths;
const BASELINE_PATH = join(REPO_ROOT, GATES.baselineFile);

/**
 * The anchors that make a token unambiguously a path. Declared when a repository
 * wants to narrow them; otherwise every top-level directory that is not build
 * output, which is the honest reading of "a real top-level directory".
 */
const governedDocs = () =>
  documentedFiles({ ignoredDocs: GATES.ignoredDocs, repoRoot: REPO_ROOT });

const REPO_ROOTS =
  GATES.repoRoots.length > 0
    ? GATES.repoRoots
    : readdirSync(REPO_ROOT, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) => !ALWAYS_SKIPPED.includes(name));

/**
 * Paths that are generated or local-only and therefore *expected* to be absent
 * from a fresh checkout — documenting them is correct, not a broken link.
 *
 * Declared rather than detected. Asking the VCS what it ignores would be more
 * general but needs a subprocess, and it disagrees with CI for anything ignored
 * through a developer's *global* config — so the gate would pass locally and
 * fail on the runner, or the reverse.
 */
const isOnDemandReport = (token) => {
  const parts = token.split('/');
  return (
    parts.length > 1 &&
    GATES.onDemandReportDirs.includes(parts.slice(0, -1).join('/'))
  );
};

const isExpectedAbsent = (token) =>
  GATES.expectedAbsent.includes(token) ||
  isOnDemandReport(token) ||
  GATES.expectedAbsentPrefixes.some((prefix) => token.startsWith(prefix));

/**
 * The workspace directory owning a doc, if any.
 *
 * A doc inside a workspace may point at a file relative to that workspace's own
 * root, which is correct in context and would otherwise be reported broken.
 */
const WORKSPACE_DIRS = readPublishing(REPO_ROOT).workspaceDirs;

const workspaceOf = (docPath) => {
  const parts = docPath.split('/');
  return parts.length > 2 && WORKSPACE_DIRS.includes(parts[0])
    ? join(REPO_ROOT, parts[0], parts[1])
    : undefined;
};

/**
 * Root-anchored tokens resolve from the repo root. A relative markdown link
 * resolves from the document's own directory. A doc may also point at a file
 * inside its own workspace, so that root is tried too.
 */
const resolvesSomewhere = (token, docPath) => {
  const roots = isRootAnchored(token, REPO_ROOTS)
    ? [REPO_ROOT, workspaceOf(docPath)]
    : [join(REPO_ROOT, dirname(docPath)), workspaceOf(docPath), REPO_ROOT];
  return roots
    .filter((root) => root !== undefined)
    .some((root) => existsSync(join(root, token)));
};

const findingsFor = (docPath) => {
  const markdown = readFileSync(join(REPO_ROOT, docPath), 'utf8');
  const unique = [...new Set(extractCandidates(markdown, REPO_ROOTS))];
  return enforcedTokens({ docPath, repoRoots: REPO_ROOTS, tokens: unique })
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
    `  repo-verify-docs-paths --accept ${first.doc} ${first.token} --reason "..."`,
  );
};

const main = () => {
  const findings = governedDocs()
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
    `Documented-path gate passed: ${governedDocs().length} doc(s) checked, ${grandfathered} grandfathered.`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
