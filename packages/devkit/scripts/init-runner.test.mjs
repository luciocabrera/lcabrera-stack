import { describe, expect, test } from 'vite-plus/test';

import { declaredDependencies, inferRunner } from './init.mjs';

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
