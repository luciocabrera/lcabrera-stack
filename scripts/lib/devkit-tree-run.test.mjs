/*
 * The registry gate runs minutes after a publish, so its install has to lift
 * pnpm's minimum release age or it resolves the release before (#1219). A
 * stand-in `vp` on PATH exits non-zero unless the override reaches it.
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
  installFindings,
  RELEASE_AGE_LIFTED,
  registryInstallFindings,
} from './devkit-tree-run.mjs';

const bin = mkdtempSync(join(tmpdir(), 'devkit-tree-run-bin-'));

writeFileSync(
  join(bin, 'vp'),
  '#!/bin/sh\n[ "$pnpm_config_minimum_release_age" = "0" ] || { echo "release age not lifted" >&2; exit 1; }\n',
);
chmodSync(join(bin, 'vp'), 0o755);

const STAND_IN = { PATH: bin };

afterAll(() => {
  rmSync(bin, { force: true, recursive: true });
});

describe('registryInstallFindings', () => {
  it('lifts the minimum release age for the install', () => {
    expect(RELEASE_AGE_LIFTED).toEqual({
      pnpm_config_minimum_release_age: '0',
    });
    expect(registryInstallFindings(bin, STAND_IN)).toEqual([]);
  });

  it('is what lifts it — the plain install leaves the delay in place', () => {
    expect(installFindings(bin, STAND_IN).join('\n')).toContain(
      'release age not lifted',
    );
  });

  it('is the install the registry gate runs', () => {
    const gate = readFileSync(
      new URL('../verify-devkit-registry.mjs', import.meta.url),
      'utf8',
    );

    expect(gate).toContain(
      'const PREREQUISITES = [runtimeFindings, registryInstallFindings];',
    );
  });
});
