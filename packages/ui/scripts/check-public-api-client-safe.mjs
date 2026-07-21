/**
 * Why this exists: `@repo/ui` ships a client bundle. Anything server-only that
 * reaches its public API — directly, or through a package it depends on —
 * breaks every consumer that bundles it for the browser.
 *
 * Two checks, because the first one alone was not enough:
 *
 *  1. **Import graph.** Walk `src/public-api.ts` through its relative imports
 *     and fail on any `node:*` specifier.
 *
 *  2. **Dependency closure.** For every `@repo/*` package in this package's
 *     runtime `dependencies`, scan that package's whole source for `node:*`
 *     and fail if it has any.
 *
 * Check 2 is the one that matters and it did not exist. Check 1 only followed
 * paths starting with `.`, so it never crossed a package boundary: it reported
 * PASS while `@repo/ui` depended on `@repo/data-access`, which depends on `pg`
 * and imports `node:crypto` — meaning anyone installing `@repo/ui` pulled a
 * Postgres driver into their dependency graph. A guard that answers a narrower
 * question than the one it appears to answer is worse than no guard, because it
 * is trusted.
 *
 * The invariant check 2 encodes: **a client-safe package may only depend on
 * workspace packages that are themselves client-safe.** No denylist of "server"
 * package names is needed — containing a `node:*` import is the signal.
 *
 * Third-party dependencies are deliberately not scanned. `@react-router/node`
 * is a legitimate runtime dependency here, reached only through the SSR-only
 * `@repo/ui/server` subpath, never through `public-api.ts`.
 *
 * Usage: `node ./scripts/check-public-api-client-safe.mjs` (wired into this
 * package's `typecheck` task). Exits 1 listing every violation, not just the
 * first.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uiRootDir = resolve(__dirname, '..');
const publicApiFilePath = resolve(uiRootDir, 'src/public-api.ts');
const workspacePackagesDir = resolve(uiRootDir, '..');
const SOURCE_FILE_PATTERN = /\.(?:tsx?|mjs|js)$/;

// The pre-`from` segment uses a single greedy quantifier (`[^'"\n]+`) with a
// single `\s` separator rather than a lazy `[^'"\n]+?` next to a greedy `\s+`.
// Because `\s` is a subset of `[^'"\n]`, the old adjacent quantifiers matched
// overlapping input and backtracked quadratically on import/export lines with no
// `from` before the quote (e.g. a long `export const … ` line). This form
// matches exactly the same strings with linear scanning.
const importExportPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"\n]+\sfrom\s+)?['"]([^'"\n]+)['"]/g;

// `matchAll` iterates against an internal clone of the regex, so the module-level
// /g pattern's `lastIndex` is never advanced and needs no reset between calls.
const collectStaticSources = (fileText) =>
  [...fileText.matchAll(importExportPattern)].map((match) => match[1]);

const collectLocalDependencyPaths = ({ fromFilePath, sources }) => {
  return sources
    .filter((source) => source.startsWith('.'))
    .map((source) => resolveLocalModuleFilePath(fromFilePath, source))
    .filter((dependencyPath) => dependencyPath !== null);
};

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

/** The `@repo/*` runtime dependencies declared by a package.json. */
const collectWorkspaceDependencyNames = (packageJsonPath) => {
  const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

  return Object.keys(manifest.dependencies ?? {}).filter((name) =>
    name.startsWith('@repo/'),
  );
};

/**
 * Server-only imports anywhere in a workspace dependency's own source. A
 * package that reaches for `node:*` cannot be safely bundled for the browser,
 * so depending on it makes this package server-only too.
 */
const collectServerOnlyUsage = (workspacePackageName) => {
  const packageDirName = workspacePackageName.replace('@repo/', '');
  const sourceDir = resolve(workspacePackagesDir, packageDirName, 'src');

  return collectSourceFiles(sourceDir).flatMap((filePath) =>
    collectStaticSources(readFileSync(filePath, 'utf8'))
      .filter((source) => source.startsWith('node:'))
      .map((source) => ({ filePath, source, workspacePackageName })),
  );
};

const formatGraphViolations = (violations) =>
  violations.length === 0
    ? []
    : [
        '',
        'Server-only imports in the public API graph — remove the SSR-only',
        'exports from the root barrel and use @repo/ui/server:',
        ...violations.map(
          ({ filePath, source }) => `- ${filePath} imports ${source}`,
        ),
      ];

const formatDependencyViolations = (violations) =>
  violations.length === 0
    ? []
    : [
        '',
        'Workspace dependencies that are not client-safe — a client-safe package',
        'may only depend on client-safe workspace packages, so move the',
        'server-only half out or depend on a narrower package:',
        ...violations.map(
          ({ filePath, source, workspacePackageName }) =>
            `- ${workspacePackageName} is a dependency, and ${filePath} imports ${source}`,
        ),
      ];

/** Pure: every violation, in report order. Empty means client-safe. */
const collectViolationReport = () => {
  const graphViolations = collectStaticDependencies(publicApiFilePath).filter(
    ({ source }) => source.startsWith('node:'),
  );
  const dependencyViolations = collectWorkspaceDependencyNames(
    resolve(uiRootDir, 'package.json'),
  ).flatMap(collectServerOnlyUsage);

  return [
    ...formatGraphViolations(graphViolations),
    ...formatDependencyViolations(dependencyViolations),
  ];
};

const main = () => {
  const reportLines = collectViolationReport();

  if (reportLines.length === 0) {
    console.log(
      'PASS: public API graph and its workspace dependencies are client-safe.',
    );
    return;
  }

  console.error(
    'FAIL: packages/ui/src/public-api.ts leaks server-only dependencies.',
  );
  console.error(reportLines.join('\n'));
  process.exitCode = 1;
};

main();
