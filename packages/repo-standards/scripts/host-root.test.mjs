import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  findRepositoryRoot,
  HOST_ROOT_ENV,
  resolveHostRoot,
  rootFromInstallPath,
} from './host-root.mjs';

describe('rootFromInstallPath', () => {
  it('returns the consumer above the FIRST node_modules segment', () => {
    expect(
      rootFromInstallPath('/srv/app/node_modules/@repo/repo-standards/scripts'),
    ).toBe('/srv/app');
  });

  it('takes the first even when pnpm nests a virtual store below it', () => {
    expect(
      rootFromInstallPath(
        '/srv/app/node_modules/.pnpm/x/node_modules/y/scripts',
      ),
    ).toBe('/srv/app');
  });

  it('is undefined for a linked copy, and for a store mounted at the root', () => {
    expect(
      rootFromInstallPath('/srv/app/packages/repo-standards/scripts'),
    ).toBeUndefined();
    expect(rootFromInstallPath('/node_modules/x/scripts')).toBeUndefined();
  });
});

describe('findRepositoryRoot', () => {
  it('walks up to the nearest directory holding a .git entry', () => {
    const root = mkdtempSync(join(tmpdir(), 'host-root-'));
    writeFileSync(join(root, '.git'), 'gitdir: elsewhere');
    const deep = join(root, 'packages', 'x', 'scripts');
    mkdirSync(deep, { recursive: true });
    expect(findRepositoryRoot(deep)).toBe(root);
  });

  it('is undefined when no ancestor has one', () => {
    const root = mkdtempSync(join(tmpdir(), 'host-root-'));
    expect(findRepositoryRoot(root)).toBeUndefined();
  });
});

describe('resolveHostRoot', () => {
  it('prefers the environment override', () => {
    expect(
      resolveHostRoot({
        env: { [HOST_ROOT_ENV]: '/elsewhere' },
        moduleDirectory: '/srv/app/node_modules/x/scripts',
      }),
    ).toBe('/elsewhere');
  });

  it('reads the override under the name the caller asks for', () => {
    expect(
      resolveHostRoot({
        env: { SCAN_REPORT_HOST_ROOT: '/elsewhere' },
        envName: 'SCAN_REPORT_HOST_ROOT',
        moduleDirectory: '/srv/app/node_modules/x/scripts',
      }),
    ).toBe('/elsewhere');
  });

  it('falls back to the install path when no override is set', () => {
    expect(
      resolveHostRoot({
        env: {},
        moduleDirectory: '/srv/app/node_modules/x/scripts',
      }),
    ).toBe('/srv/app');
  });
});
