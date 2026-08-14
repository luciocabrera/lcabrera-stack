import { describe, expect, test } from 'vite-plus/test';

import {
  HOST_ROOT_ENV,
  resolveHostRoot,
  rootFromInstallPath,
} from './resolve-host-root.mjs';

describe('rootFromInstallPath', () => {
  test('returns the consumer root left of the first node_modules segment', () => {
    expect(
      rootFromInstallPath('/srv/app/node_modules/@repo/scan-report/scripts'),
    ).toBe('/srv/app');
  });

  test("takes the FIRST segment, so pnpm's nested store still resolves to the consumer", () => {
    expect(
      rootFromInstallPath(
        '/srv/app/node_modules/.pnpm/@lcabrera+scan-report@0.1.0/node_modules/@repo/scan-report/scripts',
      ),
    ).toBe('/srv/app');
  });

  test('returns undefined for a checkout path, so the caller falls through to the git root', () => {
    expect(
      rootFromInstallPath('/home/dev/repo/packages/scan-report/scripts'),
    ).toBe(undefined);
  });

  test('returns undefined when node_modules is the root itself — there is no consumer above it', () => {
    expect(rootFromInstallPath('/node_modules/@repo/scan-report/scripts')).toBe(
      undefined,
    );
  });
});

describe('resolveHostRoot', () => {
  test('an explicit override wins over anything derivable from the path', () => {
    expect(
      resolveHostRoot({
        env: { [HOST_ROOT_ENV]: '/elsewhere' },
        moduleDirectory: '/srv/app/node_modules/@repo/scan-report/scripts',
      }),
    ).toBe('/elsewhere');
  });

  test('an installed copy resolves to the repository that installed it', () => {
    expect(
      resolveHostRoot({
        env: {},
        moduleDirectory: '/srv/app/node_modules/@repo/scan-report/scripts',
      }),
    ).toBe('/srv/app');
  });

  test('a checkout resolves to its own repository root', () => {
    const moduleDirectory = new URL('.', import.meta.url).pathname;
    expect(resolveHostRoot({ env: {}, moduleDirectory })).toBe(
      new URL('../../../', import.meta.url).pathname.replace(/\/$/, ''),
    );
  });
});
