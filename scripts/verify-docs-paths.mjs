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
 * the gate can land without a cleanup blocking it. The baseline may shrink, and
 * anything new fails.
 *
 * Usage:
 *   node scripts/verify-docs-paths.mjs            check, exit 1 on new breakage
 *   node scripts/verify-docs-paths.mjs --write    rebaseline (review the diff)
 *
 * Exit codes: 0 = clean or baselined, 1 = a document names a missing path.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
 * Every markdown file under the repo, found by walking rather than by shelling
 * out to `git ls-files`: these scripts launch no subprocess, so a PATH-resolved
 * process can never be substituted underneath a gate that runs on every push.
 */
const walkMarkdown = (dir, prefix = '') =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name)
        ? []
        : walkMarkdown(join(dir, entry.name), relativePath);
    }
    return entry.name.endsWith('.md') ? [relativePath] : [];
  });

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

const isExpectedAbsent = (token) =>
  GENERATED_OR_LOCAL.has(token) ||
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

const toBaseline = (findings) =>
  Object.fromEntries(
    [...new Set(findings.map((finding) => finding.doc))]
      .sort((left, right) => left.localeCompare(right))
      .map((doc) => [
        doc,
        findings
          .filter((finding) => finding.doc === doc)
          .map((finding) => finding.token)
          .sort((left, right) => left.localeCompare(right)),
      ]),
  );

const main = () => {
  const findings = documentedFiles()
    .flatMap((doc) => findingsFor(doc))
    .filter((finding) => !isExpectedAbsent(finding.token));

  if (process.argv.includes('--write')) {
    writeFileSync(
      BASELINE_PATH,
      `${JSON.stringify(toBaseline(findings), undefined, 2)}\n`,
    );
    console.log(
      `Documented-path baseline written: ${findings.length} grandfathered reference(s).`,
    );
    return;
  }

  const baseline = readBaseline();
  const introduced = findings.filter(
    (finding) => !(baseline[finding.doc] ?? []).includes(finding.token),
  );

  if (introduced.length > 0) {
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
      'If the reference is genuinely illustrative, add its document to IGNORED_DOCS.',
    );
    process.exitCode = 1;
    return;
  }

  const grandfathered = Object.values(baseline).flat().length;
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
