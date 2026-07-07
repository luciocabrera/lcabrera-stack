import { describe, expect, it } from 'vitest';

import { parsePnpmWorkspaceGlobs } from './parsePnpmWorkspaceGlobs.util.ts';

describe('parsePnpmWorkspaceGlobs', () => {
  it('collects packages entries and stops at the next top-level key', () => {
    const yaml = `packages:
  - apps/*
  - 'packages/*'
  - "!apps/legacy"
allowBuilds:
  esbuild: true
catalog:
  react: ^19.0.0
`;

    expect(parsePnpmWorkspaceGlobs(yaml)).toEqual([
      'apps/*',
      'packages/*',
      '!apps/legacy',
    ]);
  });

  it('ignores comments and blank lines inside the block', () => {
    const yaml = `packages:
  # the apps
  - apps/*

  - packages/* # inline comment
`;

    expect(parsePnpmWorkspaceGlobs(yaml)).toEqual(['apps/*', 'packages/*']);
  });

  it('returns [] when there is no packages block', () => {
    expect(parsePnpmWorkspaceGlobs('catalog:\n  react: ^19.0.0\n')).toEqual([]);
  });
});
