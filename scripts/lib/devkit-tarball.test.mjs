import { describe, expect, it } from 'vite-plus/test';

import {
  binStartupFailure,
  declaredBins,
  missingFromTarball,
  promisedPaths,
  strayFromTarball,
  tarballFindings,
} from './devkit-tarball.mjs';

const MANIFEST = {
  bin: { 'kit-doctor': './scripts/doctor.mjs', kit: './scripts/kit.mjs' },
  exports: {
    './config': './scripts/config.mjs',
    './package.json': './package.json',
  },
  name: '@scope/kit',
};

describe('promisedPaths', () => {
  it('collects the bins, the exports and the manifest itself', () => {
    expect(
      promisedPaths(MANIFEST).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual([
      'package.json',
      'scripts/config.mjs',
      'scripts/doctor.mjs',
      'scripts/kit.mjs',
    ]);
  });

  it('reads a conditional export target as well as a bare one', () => {
    expect(
      promisedPaths({
        exports: { '.': { default: './dist/x.mjs', types: './dist/x.d.mts' } },
      }),
    ).toEqual(expect.arrayContaining(['dist/x.mjs', 'dist/x.d.mts']));
  });
});

describe('missingFromTarball', () => {
  it('reports a promised path the tarball does not hold', () => {
    // The failure the gate exists for: a bin that resolves from the workspace
    // and was never packed. Everything here consumes these packages as
    // `workspace:*`, which ignores `files`, so nothing else can see it.
    expect(
      missingFromTarball({
        manifest: MANIFEST,
        packedPaths: ['package.json', 'scripts/kit.mjs', 'scripts/config.mjs'],
      }),
    ).toEqual(['scripts/doctor.mjs']);
  });

  it('is empty when the tarball holds everything promised', () => {
    expect(
      missingFromTarball({
        manifest: MANIFEST,
        packedPaths: [
          'package.json',
          'scripts/config.mjs',
          'scripts/doctor.mjs',
          'scripts/kit.mjs',
        ],
      }),
    ).toEqual([]);
  });

  it('leaves a wildcard target alone', () => {
    // `./scripts/*` is a pattern, not a file. Reporting it would be a finding
    // about the check rather than about the package.
    expect(
      missingFromTarball({
        manifest: { exports: { './x': './scripts/*' }, name: 'p' },
        packedPaths: ['package.json'],
      }),
    ).toEqual([]);
  });

  it('does not care how either side spells a leading dot', () => {
    expect(
      missingFromTarball({
        manifest: { bin: { p: 'scripts/p.mjs' }, name: 'p' },
        packedPaths: ['./package.json', './scripts/p.mjs'],
      }),
    ).toEqual([]);
  });
});

describe('strayFromTarball', () => {
  it('reports what no consumer should receive', () => {
    expect(
      strayFromTarball([
        'scripts/kit.mjs',
        'scripts/kit.test.mjs',
        'tsconfig.json',
        'tsconfig.app.json',
        'vite.config.ts',
        'eslint.config.mjs',
        'README.md',
      ]).toSorted((left, right) => left.localeCompare(right)),
    ).toEqual([
      'eslint.config.mjs',
      'scripts/kit.test.mjs',
      'tsconfig.app.json',
      'tsconfig.json',
      'vite.config.ts',
    ]);
  });

  it('does not mistake a source file for a test', () => {
    expect(
      strayFromTarball(['scripts/latest.mjs', 'scripts/contest.mjs']),
    ).toEqual([]);
  });
});

describe('binStartupFailure', () => {
  it('accepts a gate that ran and reported a finding', () => {
    // These bins are gates: exiting non-zero is them answering. "Did it exit 0"
    // is the wrong question and would fail every healthy install.
    expect(
      binStartupFailure({
        name: 'repo-verify-pr',
        output: 'Pull request title is missing a type\n',
        spawned: true,
      }),
    ).toBeUndefined();
  });

  it('reports a bin that never executed', () => {
    expect(
      binStartupFailure({ name: 'kit', output: '', spawned: false }),
    ).toContain('did not execute at all');
  });

  it('reports a bin that started and could not resolve its own code', () => {
    // The subtle one: the executable was packed and something it imports was
    // not. That writes a resolution error to stderr, which a naive "did it
    // produce output" check reads as a healthy run.
    for (const marker of [
      'ERR_MODULE_NOT_FOUND',
      'Cannot find module',
      'Cannot find package',
      'ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING',
    ]) {
      expect(
        binStartupFailure({
          name: 'kit',
          output: `node:internal/x\nError [${marker}]: something\n`,
          spawned: true,
        }),
      ).toContain('could not resolve its own code');
    }
  });
});

describe('declaredBins', () => {
  it('names every bin so each can be executed by name', () => {
    expect(
      declaredBins(MANIFEST)
        .map(({ name }) => name)
        .toSorted((left, right) => left.localeCompare(right)),
    ).toEqual(['kit', 'kit-doctor']);
  });

  it('is empty for a package that declares none', () => {
    expect(declaredBins({ name: 'p' })).toEqual([]);
  });
});

describe('tarballFindings', () => {
  it('reports both kinds, in a stable order', () => {
    const findings = tarballFindings({
      manifest: MANIFEST,
      packedPaths: ['package.json', 'scripts/kit.mjs', 'scripts/kit.test.mjs'],
    });

    expect(findings.map(({ kind }) => kind)).toEqual([
      'missing',
      'missing',
      'stray',
    ]);
    expect(findings[0].detail).toContain('@scope/kit');
  });

  it('is empty for a tarball a consumer could use', () => {
    expect(
      tarballFindings({
        manifest: MANIFEST,
        packedPaths: [
          'package.json',
          'scripts/config.mjs',
          'scripts/doctor.mjs',
          'scripts/kit.mjs',
        ],
      }),
    ).toEqual([]);
  });
});
