/*
 * publint over a tarball built here, so the planted fault is the only thing
 * that differs between the two cases and a clean result cannot come from a
 * check that did not run.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import {
  lintTarball,
  publintFindings,
  publintGate,
  publintLines,
  writeTarball,
} from './devkit-tarball-publint.mjs';

let into = '';

beforeEach(() => {
  into = mkdtempSync(join(tmpdir(), 'publint-test-'));
});

afterEach(() => {
  rmSync(into, { force: true, recursive: true });
});

describe('lintTarball', () => {
  it('reports an export that points at a file the tarball does not hold', async () => {
    const result = await lintTarball(
      writeTarball({
        exports: { './nested': { import: { default: './gone.mjs' } } },
        into,
        name: 'broken',
      }),
    );

    expect(result.name).toBe('broken');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/^FILE_DOES_NOT_EXIST: /u);
    expect(result.errors[0]).toContain('./gone.mjs');
  });

  it('reports nothing for a manifest whose only export is the manifest itself', async () => {
    const result = await lintTarball(
      writeTarball({
        exports: { './package.json': './package.json' },
        into,
        name: 'sound',
      }),
    );

    expect(result).toEqual({ errors: [], name: 'sound' });
  });
});

describe('publintGate', () => {
  it('turns a broken tarball into a finding and still prints a line for it', async () => {
    const tarball = writeTarball({
      exports: { '.': './gone.mjs' },
      into,
      name: 'broken',
    });

    const { findings, lines } = await publintGate({
      into,
      tarballs: [tarball],
    });

    expect(lines).toEqual(['publint broken: 1 error(s)\n']);
    expect(findings).toEqual([
      expect.stringMatching(
        /^broken: publint FILE_DOES_NOT_EXIST: .*\.\/gone\.mjs/u,
      ),
    ]);
  });

  it('passes a sound tarball with one line and no finding', async () => {
    const tarball = writeTarball({
      exports: { './package.json': './package.json' },
      into,
      name: 'sound',
    });

    expect(await publintGate({ into, tarballs: [tarball] })).toEqual({
      findings: [],
      lines: ['publint sound: no errors\n'],
    });
  });
});

describe('publintFindings', () => {
  it('fails when the planted missing export goes unreported', () => {
    expect(
      publintFindings({
        planted: { errors: [], name: 'publint-plant' },
        results: [],
      }),
    ).toEqual([expect.stringContaining('planted export')]);
  });

  it('is clean when the plant is caught and every package is', () => {
    expect(
      publintFindings({
        planted: { errors: ['FILE_DOES_NOT_EXIST: x'], name: 'publint-plant' },
        results: [{ errors: [], name: 'a' }],
      }),
    ).toEqual([]);
  });
});

describe('publintLines', () => {
  it('prints one line per package', () => {
    expect(
      publintLines([
        { errors: [], name: 'a' },
        { errors: ['E: x', 'E: y'], name: 'b' },
      ]),
    ).toEqual(['publint a: no errors\n', 'publint b: 2 error(s)\n']);
  });
});
