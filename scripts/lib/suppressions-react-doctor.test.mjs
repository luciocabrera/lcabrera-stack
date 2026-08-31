import { describe, expect, it } from 'vite-plus/test';

import { findReactDoctorSuppressions } from './suppressions-react-doctor.mjs';

const PUBLIC_FILES = [
  'packages/ui/src/components/Table/Table.component.tsx',
  'packages/utils/src/merge-arrays.util.ts',
];
const OTHER_FILES = [
  'apps/docs-site/src/hooks/useRunStatusSocket.hook.ts',
  'apps/showcase/src/root.tsx',
];
const PROJECT_DIRS = [
  'apps/docs-site',
  'apps/showcase',
  'packages/ui',
  'packages/utils',
];

const find = (config) =>
  findReactDoctorSuppressions({
    config,
    otherFiles: OTHER_FILES,
    projectDirs: PROJECT_DIRS,
    publicFiles: PUBLIC_FILES,
  });

describe('global severity downgrades', () => {
  it('reports a rule switched off, as repo-wide policy', () => {
    const [found] = find({ rules: { 'react-doctor/no-barrel-import': 'off' } });
    expect(found).toMatchObject({
      file: 'doctor.config.jsonc',
      kind: 'react-doctor',
      rule: 'rule react-doctor/no-barrel-import',
      scope: 'repo-wide',
    });
  });

  it('treats warn as a suppression, since only error fails the gate', () => {
    expect(find({ rules: { 'react-doctor/no-danger': 'warn' } })).toHaveLength(
      1,
    );
  });

  it('leaves an enforcing rule alone', () => {
    expect(find({ rules: { 'react-doctor/no-danger': 'error' } })).toEqual([]);
  });

  it('covers categories, buckets, ignored rules and ignored tags', () => {
    const found = find({
      buckets: { 'compiler-cleanup': 'off' },
      categories: { Maintainability: 'warn' },
      ignore: { rules: ['deslop/unused-dev-dependency'], tags: ['design'] },
    });
    const rules = found
      .map((row) => row.rule)
      .sort((left, right) => left.localeCompare(right));
    expect(rules).toEqual([
      'bucket compiler-cleanup',
      'category Maintainability',
      'ignored rule deslop/unused-dev-dependency',
      'ignored tag design',
    ]);
  });
});

describe('path-scoped ignores', () => {
  it('matches a project-relative glob against a public package file', () => {
    const [found] = find({
      ignore: {
        overrides: [
          {
            files: ['src/components/Table/Table.component.tsx'],
            rules: ['react-doctor/no-derived-state'],
          },
        ],
      },
    });
    expect(found).toMatchObject({
      rule: 'react-doctor/no-derived-state',
      scope: 'targeted',
    });
  });

  it('still matches the repo-relative form', () => {
    const [found] = find({
      ignore: {
        overrides: [
          { files: ['packages/utils/**'], rules: ['react-doctor/no-danger'] },
        ],
      },
    });
    expect(found?.scope).toBe('targeted');
  });

  it('classifies a glob that also escapes the public packages as repo-wide', () => {
    const [found] = find({
      ignore: {
        overrides: [{ files: ['**/*.tsx'], rules: ['react-doctor/x'] }],
      },
    });
    expect(found?.scope).toBe('repo-wide');
  });

  it('ignores a glob that reaches no public package at all', () => {
    expect(
      find({
        ignore: {
          overrides: [{ files: ['src/hooks/useRunStatusSocket.hook.ts'] }],
        },
      }),
    ).toEqual([]);
  });

  it('reports an excluded file as suppressing every rule', () => {
    const [found] = find({ ignore: { files: ['packages/utils/**'] } });
    expect(found?.rule).toBe('(all rules)');
  });
});

describe('an empty config', () => {
  it('finds nothing rather than throwing on absent keys', () => {
    expect(find({})).toEqual([]);
  });
});
