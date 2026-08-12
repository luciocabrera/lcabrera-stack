/**
 * Pure half of the route-folder naming gate — the other home of the convention
 * `local-rules/domain-folder-filename` enforces everywhere else.
 *
 * That rule classifies a folder from its PATH alone, and a path cannot say
 * whether `routes/car-sales-infinite/` holds a component called `CarSales`. Its
 * only safe answer was to exempt the whole route tree, which left every
 * `*.types` / `*.constants` file under one unchecked — not just the folder
 * pairing, the artifact naming too. The rule cannot close that itself: the
 * eslint pass is not type-aware, so there is no program to enumerate siblings
 * from, and the remaining route is a non-literal `fs` call, which
 * `security/detect-non-literal-fs-filename` forbids in a package that publishes
 * as `@lcabrera/eslint-plugin` and may not carry a suppression. A repo-level
 * script has neither constraint, so the check lives here and the rule stays
 * fast, hermetic and publishable.
 *
 * The two homes must agree, so the lists below are copies of the rule's
 * defaults and `route-artifacts.test.mjs` asserts they still match its source —
 * the same treatment `commit-convention.mjs` and `git-exec.mjs` give their own
 * unavoidable duplicates. A copy that silently drifts would take this gate
 * quiet, and a gate that checks nothing reports what compliant code reports.
 *
 * The discriminator the rule could not reach: a route folder's `*.types` /
 * `*.constants` file is named after an ARTIFACT the folder actually holds — a
 * component, layout, error boundary, context, loader, action or meta module.
 * Validated over every such file in the repo before it landed; the false
 * positive set was empty.
 */

/** Suffixes that make a file the artifact a folder is built around. */
export const ARTIFACT_SUFFIXES = new Set([
  'action',
  'clientAction',
  'component',
  'context',
  'error-boundary',
  'layout',
  'loader',
  'meta',
]);

/**
 * Copies of `domain-folder-filename`'s defaults. Kept in this order — the test
 * compares them to the rule's source, so a divergence fails rather than going
 * quiet.
 */
export const ARTIFACT_TREE_FOLDERS = ['routes'];

export const CATCH_ALL_FOLDERS = [
  'actions',
  'config',
  'constants',
  'contexts',
  'helpers',
  'hooks',
  'queries',
  'schemas',
  'selectors',
  'services',
  'src',
  'types',
  'utils',
];

export const PAIRED_SUFFIXES = ['constants', 'types'];

const CATCH_ALL = new Set(CATCH_ALL_FOLDERS);
const PAIRED = new Set(PAIRED_SUFFIXES);
const ARTIFACT_TREE = new Set(ARTIFACT_TREE_FOLDERS);

const EXTENSION = /\.(?:tsx?|jsx?|mjs|cjs)$/;
const TEST_SEGMENT = /\.(?:test|spec)$/;
const NON_ALPHANUMERIC = /[^a-z0-9]/g;

/** Mirror of the plugin's `parseFileName`: `<name>.<suffix>.<ext>`, or nothing. */
export const parseFileName = (filePath) => {
  const base = filePath.split('/').pop() ?? filePath;
  const withoutTest = base.replace(EXTENSION, '').replace(TEST_SEGMENT, '');
  const lastDot = withoutTest.lastIndexOf('.');
  if (lastDot <= 0) {
    return undefined;
  }
  return {
    name: withoutTest.slice(0, lastDot),
    suffix: withoutTest.slice(lastDot + 1),
  };
};

/**
 * Mirror of the plugin's `normalize`: one spelling of a subject, so the three
 * the repo uses compare equal — `trigger-scan`, `triggerScan` and `TriggerScan`
 * all name the same thing, and which one a file gets is decided by what it
 * holds, not by what it is about.
 */
export const normalizeSubject = (value) =>
  value.toLowerCase().replaceAll(NON_ALPHANUMERIC, '');

const directoryOf = (filePath) => filePath.slice(0, filePath.lastIndexOf('/'));

/** Tracked paths grouped by their directory — the folder listing, without `fs`. */
export const groupByDirectory = (paths) => {
  const byDirectory = new Map();
  for (const filePath of paths) {
    const directory = directoryOf(filePath);
    const siblings = byDirectory.get(directory);
    if (siblings === undefined) {
      byDirectory.set(directory, [filePath]);
    } else {
      siblings.push(filePath);
    }
  }
  return byDirectory;
};

/** Under an artifact tree is exactly what the ESLint rule exempts. */
const isUnderArtifactTree = (filePath) =>
  directoryOf(filePath)
    .split('/')
    .some((segment) => ARTIFACT_TREE.has(segment));

/** The `*.types`/`*.constants` files the ESLint rule leaves to this gate. */
export const candidatesIn = (paths) =>
  paths.filter((filePath) => {
    const parsed = parseFileName(filePath);
    return (
      parsed !== undefined &&
      PAIRED.has(parsed.suffix) &&
      isUnderArtifactTree(filePath) &&
      !CATCH_ALL.has(directoryOf(filePath).split('/').pop())
    );
  });

/** Distinct base names of the artifacts a folder holds. */
export const artifactNamesIn = (siblings) => [
  ...new Set(
    siblings
      .map((filePath) => parseFileName(filePath))
      .filter(
        (parsed) =>
          parsed !== undefined && ARTIFACT_SUFFIXES.has(parsed.suffix),
      )
      .map((parsed) => parsed.name),
  ),
];

/**
 * Every route-folder file that names no artifact in its folder, plus what the
 * gate skipped and why, so a run that checks nothing cannot look like a run that
 * found nothing.
 *
 * The base need only PREFIX an artifact, which is the relation
 * `domain-folder-filename` already uses inside an artifact folder — the two
 * homes would otherwise disagree about `TableConfigContext.types.ts`. A folder
 * with no artifact at all is skipped rather than reported: there is no name to
 * require, and inventing one would be this gate guessing.
 */
export const routeArtifactReport = (trackedPaths) => {
  const byDirectory = groupByDirectory(trackedPaths);
  const candidates = candidatesIn(trackedPaths);

  const findings = [];
  const skipped = [];
  for (const filePath of candidates) {
    const directory = directoryOf(filePath);
    const artifacts = artifactNamesIn(byDirectory.get(directory) ?? []);
    if (artifacts.length === 0) {
      skipped.push(filePath);
      continue;
    }
    const named = normalizeSubject(parseFileName(filePath).name);
    if (
      !artifacts.some((artifact) =>
        named.startsWith(normalizeSubject(artifact)),
      )
    ) {
      findings.push({ artifacts, filePath });
    }
  }

  return { checked: candidates.length - skipped.length, findings, skipped };
};

/** One reported line: the file, and the artifacts it could legitimately name. */
export const describeFinding = (finding) => {
  const parsed = parseFileName(finding.filePath);
  const options = finding.artifacts
    .map((artifact) => `${artifact}.${parsed.suffix}`)
    .join(', ');
  return `${finding.filePath}: '${parsed.name}.${parsed.suffix}' names no artifact in its folder — rename it (git mv) to one of: ${options}`;
};
