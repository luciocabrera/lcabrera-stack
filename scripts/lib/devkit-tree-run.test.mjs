/*
 * The registry gate runs minutes after a publish, so the install the published
 * initializer runs has to lift pnpm's minimum release age or it resolves the
 * release before (#1219), and has to run without `CI`, as a user's machine
 * does. A stand-in initializer runs the stand-in `vp install` the way `create`
 * does; that `vp` exits non-zero unless the environment reaches it as the gate
 * means it to.
 */
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import {
  createFindings,
  RELEASE_AGE_LIFTED,
  registryCreateEnv,
} from './devkit-tree-run.mjs';

const bin = mkdtempSync(join(tmpdir(), 'devkit-tree-run-bin-'));

const executable = (name, body) => {
  writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
  chmodSync(join(bin, name), 0o755);
};

executable(
  'vp',
  [
    '[ "$pnpm_config_minimum_release_age" = "0" ] || { echo "release age not lifted" >&2; exit 1; }',
    '[ -z "$CI" ] || { echo "CI reached the install" >&2; exit 1; }',
  ].join('\n'),
);
executable('initializer', 'exec vp install');

const STAND_IN = { CI: 'true', PATH: bin };

const created = (env) =>
  createFindings({
    args: [],
    bin: join(bin, 'initializer'),
    env,
    parent: bin,
  }).join('\n');

afterAll(() => {
  rmSync(bin, { force: true, recursive: true });
});

describe('registryCreateEnv', () => {
  it('lifts the minimum release age and drops CI for the install create runs', () => {
    expect(RELEASE_AGE_LIFTED).toEqual({
      pnpm_config_minimum_release_age: '0',
    });
    expect(created(registryCreateEnv(STAND_IN))).toBe('');
  });

  it('is what lifts it — the plain environment leaves the delay in place', () => {
    expect(created(STAND_IN)).toContain('release age not lifted');
  });

  it('is what drops CI — lifting the age alone still hands the install CI', () => {
    expect(created({ ...STAND_IN, ...RELEASE_AGE_LIFTED })).toContain(
      'CI reached the install',
    );
  });

  it('is the environment the registry gate runs create in', () => {
    const gate = readFileSync(
      new URL('../verify-devkit-registry.mjs', import.meta.url),
      'utf8',
    );

    expect(gate).toContain('env: registryCreateEnv(),');
  });
});
