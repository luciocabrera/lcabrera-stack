import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  COVERAGE_MERGE_WORKSPACES,
  COVERAGE_REPORT_WORKSPACES,
  publicPackageDirs,
} from './coverage-workspaces.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const dirsOf = (workspaces) => workspaces.map((workspace) => workspace.dir);

describe('publicPackageDirs', () => {
  it('resolves a non-empty set from the repository', () => {
    expect(publicPackageDirs(REPO_ROOT).length).toBeGreaterThan(0);
  });

  it('resolves only real workspace directories', () => {
    for (const dir of publicPackageDirs(REPO_ROOT)) {
      expect(existsSync(join(REPO_ROOT, dir, 'package.json'))).toBe(true);
    }
  });

  it('ignores workspaces that commit their suppressions file', () => {
    const dirs = publicPackageDirs(REPO_ROOT);
    expect(dirs).not.toContain('apps/showcase');
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
    expect(dirsOf(COVERAGE_MERGE_WORKSPACES)).not.toContain('apps/showcase');
  });
});
