/**
 * Why this exists: `@lcabrera/ui` ships a client bundle. Anything server-only that
 * reaches its public API — directly, or through a package it depends on —
 * breaks every consumer that bundles it for the browser.
 *
 * Two checks, because the first one alone was not enough:
 *
 *  1. **Import graph.** Walk `src/public-api.ts` through its relative imports
 *     and fail on any `node:` specifier.
 *
 *  2. **Dependency closure.** Walk this package's runtime `dependencies` to
 *     every workspace package they reach — theirs, and theirs in turn — and fail
 *     on a `node:` specifier anywhere in the source those packages publish. The
 *     walk is transitive because the invariant is: an install pulls the whole
 *     closure, so a direct-edge-only check passes whenever a server-only import
 *     sits one package further out. Which dependencies those are, and which
 *     directory each one lives in, are answered by the workspace roster rather
 *     than by the shape of the package name: a name-prefix filter stopped
 *     matching anything at the npm scope rename (ADR-040) and this half went
 *     quiet with no edit and no failing test (#1010).
 *
 *     A file a dependency's `files` field excludes — its colocated tests, its
 *     benchmarks — is not read. No install receives it, so a `node:` import
 *     there reaches no consumer's bundle and is not this gate's business.
 *
 * Check 2 is the one that matters and it did not exist. Check 1 only followed
 * paths starting with `.`, so it never crossed a package boundary: it reported
 * PASS while `@lcabrera/ui` depended on `@lcabrera/server`, which depends on `pg`
 * and imports `node:crypto` — meaning anyone installing `@lcabrera/ui` pulled a
 * Postgres driver into their dependency graph. A guard that answers a narrower
 * question than the one it appears to answer is worse than no guard, because it
 * is trusted.
 *
 * The invariant check 2 encodes: **a client-safe package may only depend on
 * workspace packages that are themselves client-safe.** No denylist of "server"
 * package names is needed — reaching for a `node:` builtin is the signal.
 *
 * A scan that selected nothing, or that placed a dependency in a directory with
 * no source under it, exits non-zero too: a run that opened no file otherwise
 * prints exactly what a run that opened every file and found nothing prints.
 *
 * Third-party dependencies are deliberately not scanned. `@react-router/node`
 * is a legitimate runtime dependency here, reached only through the SSR-only
 * `@lcabrera/ui/server` subpath, never through `public-api.ts`.
 *
 * Usage: `node ./scripts/check-public-api-client-safe.mjs` (wired into this
 * package's `typecheck` task). Exits 1 listing every violation, not just the
 * first.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildWorkspaceDirectoryIndex,
  collectClientSafetyReport,
} from './client-safety.mjs';

const uiRootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(uiRootDir, '..', '..');

const main = () => {
  const { reportLines, scannedPackageNames } = collectClientSafetyReport({
    manifest: JSON.parse(
      readFileSync(resolve(uiRootDir, 'package.json'), 'utf8'),
    ),
    publicApiFilePath: resolve(uiRootDir, 'src/public-api.ts'),
    workspaceDirectories: buildWorkspaceDirectoryIndex(repoRoot),
  });

  if (reportLines.length === 0) {
    console.log(
      `PASS: the public API graph, and the source of ${scannedPackageNames.join(', ')}, are client-safe.`,
    );
    return;
  }

  console.error('FAIL: packages/ui is not verified client-safe.');
  console.error(reportLines.join('\n'));
  process.exitCode = 1;
};

main();
