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

export const normalizeSubject = (value) =>
  value.toLowerCase().replaceAll(NON_ALPHANUMERIC, '');

const directoryOf = (filePath) => {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash === -1 ? '' : filePath.slice(0, lastSlash);
};

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

const isUnderArtifactTree = (filePath) =>
  directoryOf(filePath)
    .split('/')
    .some((segment) => ARTIFACT_TREE.has(segment));

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

export const describeFinding = (finding) => {
  const parsed = parseFileName(finding.filePath);
  const options = finding.artifacts
    .map((artifact) => `${artifact}.${parsed.suffix}`)
    .join(', ');
  return `${finding.filePath}: '${parsed.name}.${parsed.suffix}' names no artifact in its folder — rename it (git mv) to one of: ${options}`;
};
