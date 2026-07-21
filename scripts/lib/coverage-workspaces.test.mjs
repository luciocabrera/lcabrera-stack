import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  COVERAGE_MERGE_WORKSPACES,
  COVERAGE_REPORT_WORKSPACES,
  publicPackageDirs,
} from './coverage-workspaces.mjs';

// The invariant these assertions defend: every never-baseline package is
// visible in both coverage lanes. `@repo/api` fell out of the PR comment when
// the runtime split (ADR-038) turned one `data-access` row into `server`, and
// nothing noticed for the life of the split — the job stayed green, the fallow
// merge kept the package, and a report missing a row reads exactly like a
// complete one. Dropping a public package must now fail a test instead.
//
// Everything keys on the DIRECTORY rather than the package name, so the
// forthcoming npm scope rename cannot quietly defeat the check.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const dirsOf = (workspaces) => workspaces.map((workspace) => workspace.dir);

describe('publicPackageDirs', () => {
  // Without this, every "public packages are reported" assertion below would
  // pass vacuously if the resolver ever stopped finding anything — the exact
  // silent-success failure mode this file exists to prevent.
  it('resolves a non-empty set from the repository', () => {
    expect(publicPackageDirs(REPO_ROOT).length).toBeGreaterThan(0);
  });

  it('resolves only real workspace directories', () => {
    for (const dir of publicPackageDirs(REPO_ROOT)) {
      expect(existsSync(join(REPO_ROOT, dir, 'package.json'))).toBe(true);
    }
  });

  it('ignores workspaces that commit their suppressions file', () => {
    // A baselining workspace is not public-facing; if this ever returned every
    // workspace, the checks below would stop meaning anything.
    const dirs = publicPackageDirs(REPO_ROOT);
    expect(dirs).not.toContain('apps/react-router');
  });

  it('returns an empty set for a directory with no workspaces', () => {
    expect(publicPackageDirs(join(REPO_ROOT, 'scripts'))).toEqual([]);
  });
});

describe('COVERAGE_REPORT_WORKSPACES', () => {
  it('includes every public package', () => {
    expect(dirsOf(COVERAGE_REPORT_WORKSPACES)).toEqual(
      expect.arrayContaining(publicPackageDirs(REPO_ROOT)),
    );
  });

  it('points only at real workspace directories', () => {
    for (const dir of dirsOf(COVERAGE_REPORT_WORKSPACES)) {
      expect(existsSync(join(REPO_ROOT, dir, 'package.json'))).toBe(true);
    }
  });

  it('lists each workspace once', () => {
    const dirs = dirsOf(COVERAGE_REPORT_WORKSPACES);
    expect(new Set(dirs).size).toBe(dirs.length);
  });
});

describe('COVERAGE_MERGE_WORKSPACES', () => {
  it('includes every public package', () => {
    expect(dirsOf(COVERAGE_MERGE_WORKSPACES)).toEqual(
      expect.arrayContaining(publicPackageDirs(REPO_ROOT)),
    );
  });

  it('points only at real workspace directories', () => {
    for (const dir of dirsOf(COVERAGE_MERGE_WORKSPACES)) {
      expect(existsSync(join(REPO_ROOT, dir, 'package.json'))).toBe(true);
    }
  });

  it('excludes the showcase app the fallow merge deliberately skips', () => {
    // Not stylistic: pulling react-router in would drag the repo's largest
    // suite into the fallow lane, whose findings are baselined anyway.
    expect(dirsOf(COVERAGE_MERGE_WORKSPACES)).not.toContain(
      'apps/react-router',
    );
  });
});
