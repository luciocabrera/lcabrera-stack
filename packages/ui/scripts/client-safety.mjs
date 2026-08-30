/**
 * The deciding half of this package's client-safety gate: which imports make a
 * package server-only, which packages sit in this one's workspace dependency
 * closure, and which of their files a consumer actually installs. The effects —
 * resolving paths, printing, the exit code — are in
 * `check-public-api-client-safe.mjs` beside it.
 *
 * Three rules here exist because the gate reported a pass it had not earned for a
 * scope rename's worth of commits: dependency selection asks the workspace
 * roster rather than matching a name prefix, it follows every edge rather than
 * only the ones this package declares itself, and a scan that opened nothing is
 * reported as a defect instead of as a clean run. The requirement this serves is
 * docs/product/requirements/the-ui-package-stays-client-safe.md.
 */

import { deriveWorkspaces } from '@lcabrera/repo-standards/workspace-scopes';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, matchesGlob, relative, resolve, sep } from 'node:path';

const SOURCE_FILE_PATTERN = /\.(?:tsx?|mjs|js)$/;
const WORKSPACE_PARENT_DIR = { app: 'apps', pkg: 'packages' };

// Every junction between two quantifiers here is over disjoint character sets,
// which is what keeps the scan linear.
//
// An earlier pass fixed only half of this. It replaced a lazy `[^'"\n]+?` beside
// a greedy `\s+` with a single greedy `[^'"\n]+` and one `\s` separator — but
// left the keyword's own `\s+` sitting directly in front of `[^'"\n]+`, and `\s`
// is a subset of `[^'"\n]`. So a line like `export` followed by a long run of
// spaces still split ambiguously between the two quantifiers and backtracked
// quadratically. Anchoring the pre-`from` segment on `\S` removes that overlap.
//
// The strings matched are unchanged: the preceding `\s+` is greedy, so the next
// character can never have been whitespace anyway.
const importExportPattern =
  /(?:import|export)\s+(?:type\s+)?(?:\S[^'"\n]*\sfrom\s+)?['"]([^'"\n]+)['"]/g;

// `matchAll` iterates against an internal clone of the regex, so the module-level
// /g pattern's `lastIndex` is never advanced and needs no reset between calls.
const collectStaticSources = (fileText) =>
  [...fileText.matchAll(importExportPattern)].map((match) => match[1]);

const resolveLocalModuleFilePath = (fromFilePath, source) => {
  const basePath = resolve(dirname(fromFilePath), source);
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    resolve(basePath, 'index.ts'),
    resolve(basePath, 'index.tsx'),
    resolve(basePath, 'index.js'),
    resolve(basePath, 'index.mjs'),
  ];

  return (
    candidates.find(
      (candidatePath) =>
        existsSync(candidatePath) && statSync(candidatePath).isFile(),
    ) ?? null
  );
};

const collectLocalDependencyPaths = ({ fromFilePath, sources }) => {
  return sources
    .filter((source) => source.startsWith('.'))
    .map((source) => resolveLocalModuleFilePath(fromFilePath, source))
    .filter((dependencyPath) => dependencyPath !== null);
};

const collectStaticDependencies = (filePath, seen = new Set()) => {
  if (seen.has(filePath)) {
    return [];
  }

  seen.add(filePath);

  const fileText = readFileSync(filePath, 'utf8');
  const sources = collectStaticSources(fileText);
  const directDependencies = sources.map((source) => ({ filePath, source }));
  const localDependencyPaths = collectLocalDependencyPaths({
    fromFilePath: filePath,
    sources,
  });

  const nestedDependencies = localDependencyPaths.flatMap((dependencyPath) =>
    collectStaticDependencies(dependencyPath, seen),
  );

  return [...directDependencies, ...nestedDependencies];
};

/** Every source file under a directory, recursively (node_modules excluded). */
const collectSourceFiles = (directoryPath) => {
  if (!existsSync(directoryPath)) {
    return [];
  }

  return readdirSync(directoryPath, { withFileTypes: true }).flatMap(
    (entry) => {
      const entryPath = join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return entry.name === 'node_modules'
          ? []
          : collectSourceFiles(entryPath);
      }

      return SOURCE_FILE_PATTERN.test(entry.name) ? [entryPath] : [];
    },
  );
};

const readManifest = (packageDir) => {
  const manifestPath = join(packageDir, 'package.json');

  return existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : null;
};

const collectUnpublishedGlobs = (manifest) =>
  (manifest.files ?? [])
    .filter((entry) => entry.startsWith('!'))
    .map((entry) => entry.slice(1));

const isPublished = ({ filePath, packageDir, unpublishedGlobs }) => {
  const packageRelativePath = relative(packageDir, filePath)
    .split(sep)
    .join('/');

  return !unpublishedGlobs.some(
    (glob) =>
      matchesGlob(packageRelativePath, glob) ||
      matchesGlob(packageRelativePath, `${glob}/**`),
  );
};

export const collectPublishedSourceFiles = (packageDir) => {
  const unpublishedGlobs = collectUnpublishedGlobs(
    readManifest(packageDir) ?? {},
  );

  return collectSourceFiles(join(packageDir, 'src')).filter((filePath) =>
    isPublished({ filePath, packageDir, unpublishedGlobs }),
  );
};

export const buildWorkspaceDirectoryIndex = (repoRoot) =>
  new Map(
    deriveWorkspaces(repoRoot)
      .map(({ kind, name }) => join(repoRoot, WORKSPACE_PARENT_DIR[kind], name))
      .map((packageDir) => ({
        packageDir,
        packageName: readManifest(packageDir)?.name ?? null,
      }))
      .filter(({ packageName }) => packageName !== null)
      .map(({ packageDir, packageName }) => [packageName, packageDir]),
  );

export const selectWorkspaceDependencies = ({
  manifest,
  workspaceDirectories,
}) =>
  Object.entries(manifest.dependencies ?? {})
    .filter(
      ([name, versionSpec]) =>
        workspaceDirectories.has(name) ||
        String(versionSpec).startsWith('workspace:'),
    )
    .map(([name]) => ({
      packageDir: workspaceDirectories.get(name) ?? null,
      packageName: name,
    }));

const collectEdgesOf = ({ dependency, workspaceDirectories }) =>
  dependency.packageDir === null
    ? []
    : selectWorkspaceDependencies({
        manifest: readManifest(dependency.packageDir) ?? {},
        workspaceDirectories,
      }).map((edge) => ({ ...edge, requiredBy: dependency.packageName }));

const selectArrivals = ({ frontier, seen }) =>
  frontier.filter(
    (dependency, index) =>
      !seen.has(dependency.packageName) &&
      frontier.findIndex(
        ({ packageName }) => packageName === dependency.packageName,
      ) === index,
  );

const walkClosure = ({ frontier, seen, workspaceDirectories }) => {
  const arrivals = selectArrivals({ frontier, seen });

  if (arrivals.length === 0) {
    return [];
  }

  return [
    ...arrivals,
    ...walkClosure({
      frontier: arrivals.flatMap((dependency) =>
        collectEdgesOf({ dependency, workspaceDirectories }),
      ),
      seen: new Set([
        ...seen,
        ...arrivals.map(({ packageName }) => packageName),
      ]),
      workspaceDirectories,
    }),
  ];
};

export const collectDependencyClosure = ({ manifest, workspaceDirectories }) =>
  walkClosure({
    frontier: selectWorkspaceDependencies({
      manifest,
      workspaceDirectories,
    }).map((dependency) => ({ ...dependency, requiredBy: manifest.name })),
    seen: new Set(manifest.name === undefined ? [] : [manifest.name]),
    workspaceDirectories,
  });

export const scanWorkspaceDependencies = ({ manifest, workspaceDirectories }) =>
  collectDependencyClosure({ manifest, workspaceDirectories }).map(
    (dependency) => ({
      ...dependency,
      sourceFiles:
        dependency.packageDir === null
          ? []
          : collectPublishedSourceFiles(dependency.packageDir),
    }),
  );

const describeEdge = ({ packageName, requiredBy }) =>
  `${packageName} is a dependency of ${requiredBy}`;

const collectServerOnlyUsage = ({ packageName, requiredBy, sourceFiles }) =>
  sourceFiles.flatMap((filePath) =>
    collectStaticSources(readFileSync(filePath, 'utf8'))
      .filter((source) => source.startsWith('node:'))
      .map((source) => ({ filePath, packageName, requiredBy, source })),
  );

export const collectScanDefects = (scans) => [
  ...(scans.length === 0
    ? [
        'no workspace dependency was selected, so the closure was never opened — a scan of nothing is not a pass',
      ]
    : []),
  ...scans
    .filter(({ packageDir }) => packageDir === null)
    .map(
      (scan) =>
        `${describeEdge(scan)}, but no workspace in pnpm-workspace.yaml publishes that name`,
    ),
  ...scans
    .filter(
      ({ packageDir, sourceFiles }) =>
        packageDir !== null && sourceFiles.length === 0,
    )
    .map(
      ({ packageDir, packageName }) =>
        `${packageName} resolved to ${packageDir}, whose published src/ holds no source file — nothing was scanned for it`,
    ),
];

const formatScanDefects = (defects) =>
  defects.length === 0
    ? []
    : [
        '',
        'The dependency-closure scan could not do its job. Every line below is a',
        'gap in the check itself, not in the packages — fix it rather than reading',
        'the absence of violations as a pass:',
        ...defects.map((defect) => `- ${defect}`),
      ];

const formatGraphViolations = (violations) =>
  violations.length === 0
    ? []
    : [
        '',
        'Server-only imports in the public API graph — remove the SSR-only',
        'exports from the root barrel and use @lcabrera/ui/server:',
        ...violations.map(
          ({ filePath, source }) => `- ${filePath} imports ${source}`,
        ),
      ];

const formatDependencyViolations = (violations) =>
  violations.length === 0
    ? []
    : [
        '',
        'Workspace packages in the dependency closure that are not client-safe — a',
        'client-safe package may only depend on client-safe workspace packages, so',
        'move the server-only half out or depend on a narrower package:',
        ...violations.map(
          (violation) =>
            `- ${describeEdge(violation)}, and ${violation.filePath} imports ${violation.source}`,
        ),
      ];

export const collectClientSafetyReport = ({
  manifest,
  publicApiFilePath,
  workspaceDirectories,
}) => {
  const scans = scanWorkspaceDependencies({ manifest, workspaceDirectories });
  const graphViolations = collectStaticDependencies(publicApiFilePath).filter(
    ({ source }) => source.startsWith('node:'),
  );

  return {
    reportLines: [
      ...formatScanDefects(collectScanDefects(scans)),
      ...formatGraphViolations(graphViolations),
      ...formatDependencyViolations(scans.flatMap(collectServerOnlyUsage)),
    ],
    scannedPackageNames: scans.map(({ packageName }) => packageName),
  };
};
