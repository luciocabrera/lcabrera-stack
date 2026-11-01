import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterAll, describe, expect, it } from 'vite-plus/test';

import { caseIdFrom, repoPath, toolEntry } from './tool-paths.mjs';

const made = [];

afterAll(() => {
  for (const path of made) rmSync(path, { force: true, recursive: true });
});

const ROOT = realpathSync(mkdtempSync(join(tmpdir(), 'tool-paths-root-')));
const OUTSIDE = realpathSync(mkdtempSync(join(tmpdir(), 'tool-paths-out-')));
made.push(ROOT, OUTSIDE);
mkdirSync(join(ROOT, 'docs'));
writeFileSync(join(ROOT, 'docs/a.json'), '{}');
writeFileSync(join(OUTSIDE, 'secret.json'), '{}');
symlinkSync(OUTSIDE, join(ROOT, 'escape'));
symlinkSync(join(ROOT, 'docs'), join(ROOT, 'inside-link'));
symlinkSync(join(ROOT, 'gone'), join(ROOT, 'dangling'));

describe('repoPath', () => {
  it('resolves a path inside the root, existing or not yet written', () => {
    expect(repoPath({ path: 'docs/a.json', root: ROOT })).toBe(
      join(ROOT, 'docs/a.json'),
    );
    expect(repoPath({ path: 'docs/new/b.json', root: ROOT })).toBe(
      join(ROOT, 'docs/new/b.json'),
    );
    expect(repoPath({ path: '.', root: ROOT })).toBe(ROOT);
  });

  it('follows a symlink that stays inside the root', () => {
    expect(repoPath({ path: 'inside-link/a.json', root: ROOT })).toBe(
      join(ROOT, 'docs/a.json'),
    );
  });

  it.each([
    '../outside.json',
    '/etc/passwd',
    'docs/../../x',
    'escape/secret.json',
    'escape/new/output.json',
    'dangling',
    'dangling/new.json',
  ])('refuses %s', (path) => {
    expect(() => repoPath({ path, root: ROOT })).toThrow(
      `${path} resolves outside the repository`,
    );
  });

  it('refuses a sibling directory that shares the root as a prefix', () => {
    expect(() =>
      repoPath({ path: `../${ROOT.split('/').at(-1)}-other/x`, root: ROOT }),
    ).toThrow('resolves outside the repository');
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
