import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { caseIdFrom, repoPath, toolEntry } from './tool-paths.mjs';

const ROOT = resolve('/repo');

describe('repoPath', () => {
  it('resolves a path inside the root', () => {
    expect(repoPath({ path: 'docs/a.json', root: ROOT })).toBe(
      join(ROOT, 'docs/a.json'),
    );
    expect(repoPath({ path: '.', root: ROOT })).toBe(ROOT);
  });

  it.each(['../outside.json', '/etc/passwd', 'docs/../../x'])(
    'refuses %s',
    (path) => {
      expect(() => repoPath({ path, root: ROOT })).toThrow(
        `${path} resolves outside the repository`,
      );
    },
  );

  it('refuses a sibling directory that shares the root as a prefix', () => {
    expect(() => repoPath({ path: '../repo-other/x', root: ROOT })).toThrow(
      'resolves outside the repository',
    );
  });
});

describe('caseIdFrom', () => {
  it('keeps a case id', () => {
    expect(caseIdFrom('FP-0042')).toBe('FP-0042');
  });

  it.each(['FP-42', 'FP-00042', '../FP-0001', 'FP-0001/..', undefined])(
    'refuses %j',
    (value) => {
      expect(() => caseIdFrom(value)).toThrow(
        `"${value}" is not a case id of the form FP-nnnn`,
      );
    },
  );
});

describe('toolEntry', () => {
  const root = resolve(import.meta.dirname, '..', '..');

  it.each([
    ['fallow', /node_modules\/fallow\/bin\/fallow$/u],
    ['vp', /node_modules\/vite-plus\/bin\/vp$/u],
    ['biome', /@biomejs\/biome\/bin\/biome$/u],
  ])("resolves %s's own entry from the repository", (tool, pattern) => {
    expect(toolEntry({ from: root, tool })).toMatch(pattern);
  });

  it('resolves ESLint from the workspace that runs it', () => {
    expect(
      toolEntry({ from: join(root, 'packages/utils'), tool: 'eslint' }),
    ).toMatch(/eslint\/bin\/eslint\.js$/u);
  });

  it('refuses a tool it does not know', () => {
    expect(() => toolEntry({ from: root, tool: 'sh' })).toThrow(
      'no tool named "sh"',
    );
  });
});
