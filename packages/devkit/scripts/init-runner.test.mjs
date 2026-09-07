import { describe, expect, test } from 'vite-plus/test';

import {
  declaredDependencies,
  inferRunner,
  runnerFromUserAgent,
} from './init.mjs';

describe('declaredDependencies', () => {
  test('reads both blocks, since either puts a bin on the path', () => {
    expect(
      declaredDependencies({
        dependencies: { react: '19' },
        devDependencies: { 'vite-plus': '1' },
      }),
    ).toEqual(['react', 'vite-plus']);
  });

  test('an absent manifest or an absent block reads as none', () => {
    expect(declaredDependencies(undefined)).toEqual([]);
    expect(declaredDependencies({})).toEqual([]);
    expect(declaredDependencies({ dependencies: { react: '19' } })).toEqual([
      'react',
    ]);
    expect(
      declaredDependencies({ devDependencies: { 'vite-plus': '1' } }),
    ).toEqual(['vite-plus']);
  });
});

describe('inferRunner', () => {
  test('prefers the declared runner over the lockfile beneath it', () => {
    expect(
      inferRunner({
        dependencies: ['vite-plus'],
        files: ['pnpm-lock.yaml', 'package.json'],
      }).name,
    ).toBe('vite-plus');
  });

  test('reads pnpm from either of its two marker files', () => {
    expect(inferRunner({ files: ['pnpm-lock.yaml'] }).name).toBe('pnpm');
    expect(inferRunner({ files: ['pnpm-workspace.yaml'] }).name).toBe('pnpm');
  });

  test('reads yarn and bun from their lockfiles', () => {
    expect(inferRunner({ files: ['yarn.lock'] }).name).toBe('yarn');
    expect(inferRunner({ files: ['bun.lockb'] }).name).toBe('bun');
  });

  test('falls back to npm, which every repository with a manifest can run', () => {
    expect(inferRunner({ files: ['package.json'] }).name).toBe('npm');
    expect(inferRunner().name).toBe('npm');
  });

  test('only the runners a runner image lacks bring their own setup step', () => {
    const setupFor = (context) => inferRunner(context).ciSetup;

    expect(setupFor({ dependencies: ['vite-plus'] }).join('\n')).toContain(
      'voidzero-dev/setup-vp@',
    );
    expect(setupFor({ files: ['bun.lock'] }).join('\n')).toContain(
      'oven-sh/setup-bun@',
    );

    expect(setupFor({ files: ['pnpm-lock.yaml'] })).toEqual([]);
    expect(setupFor({ files: ['yarn.lock'] })).toEqual([]);
    expect(setupFor()).toEqual([]);
  });

  test('pins every setup action to a commit sha', () => {
    for (const context of [
      { dependencies: ['vite-plus'] },
      { files: ['bun.lock'] },
    ]) {
      for (const line of inferRunner(context).ciSetup) {
        if (!line.includes('uses:')) continue;
        expect(line).toMatch(/uses: [^@]+@[0-9a-f]{40}\b/);
      }
    }
  });

  test('every runner answers all four keys the shipped files ask for', () => {
    for (const files of [
      ['pnpm-lock.yaml'],
      ['yarn.lock'],
      ['bun.lockb'],
      ['package.json'],
    ]) {
      expect(Object.keys(inferRunner({ files }).commands).toSorted()).toEqual([
        'audit',
        'check',
        'install',
        'test',
      ]);
    }
  });
});

describe('runnerFromUserAgent', () => {
  test('reads the runner a package manager names for what it launched', () => {
    expect(runnerFromUserAgent('pnpm/11.25.0 npm/? node/v26 linux x64')).toBe(
      'pnpm',
    );
    expect(runnerFromUserAgent('yarn/4.0.0 npm/? node/v22')).toBe('yarn');
    expect(runnerFromUserAgent('bun/1.1.0')).toBe('bun');
  });

  test('answers undefined for an agent this kit has no commands for', () => {
    expect(runnerFromUserAgent('deno/2.0.0')).toBeUndefined();
    expect(runnerFromUserAgent('')).toBeUndefined();
    expect(runnerFromUserAgent(undefined)).toBeUndefined();
  });
});

describe('the launching agent as evidence', () => {
  test('decides an empty tree, which is the only tree that has no other evidence', () => {
    expect(inferRunner({ userAgent: 'pnpm/11.25.0 npm/? node/v26' }).name).toBe(
      'pnpm',
    );
    expect(
      inferRunner({ userAgent: 'pnpm/11.25.0' }).commands.install,
    ).toContain('pnpm');
  });

  test('never outranks a lockfile, which is a fact about the repository', () => {
    expect(
      inferRunner({
        files: ['yarn.lock'],
        userAgent: 'pnpm/11.25.0 npm/? node/v26',
      }).name,
    ).toBe('yarn');
    expect(
      inferRunner({
        dependencies: ['vite-plus'],
        userAgent: 'npm/11.19.0 node/v26',
      }).name,
    ).toBe('vite-plus');
  });

  test('leaves the npm fallback in place when nothing named a runner', () => {
    expect(inferRunner({ userAgent: 'deno/2.0.0' }).name).toBe('npm');
    expect(inferRunner().name).toBe('npm');
  });
});
