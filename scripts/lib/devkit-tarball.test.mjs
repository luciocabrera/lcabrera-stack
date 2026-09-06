import { describe, expect, it } from 'vite-plus/test';

import {
  binsWithoutShebang,
  binStartupFailure,
  declaredBins,
  failureLine,
  gateProbeFindings,
  materialisationFailure,
  noCommandsDeclared,
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

  it('accepts a gate that REPORTS a resolution problem it found', () => {
    expect(
      binStartupFailure({
        name: 'repo-verify-publish',
        output:
          '  • @scope/x: Cannot find module ./dist/index.mjs in the tarball\n',
        spawned: true,
      }),
    ).toBeUndefined();
  });

  it('reports a bin that started and could not resolve its own code', () => {
    for (const marker of [
      'ERR_MODULE_NOT_FOUND',
      'Cannot find module',
      'Cannot find package',
      'ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING',
    ]) {
      expect(
        binStartupFailure({
          name: 'kit',
          output: `node:internal/modules/esm/resolve\nError [${marker}]: something imported from /x\n`,
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

describe('binsWithoutShebang', () => {
  const manifest = { bin: { kit: './scripts/kit.mjs' }, name: '@scope/kit' };

  it('reports a bin the shell would be handed', () => {
    expect(
      binsWithoutShebang({
        manifest,
        readPackedFile: () => '/**\n * A header.\n */\nconsole.log(1);\n',
      }),
    ).toEqual([expect.stringContaining('has no shebang')]);
  });

  it('accepts a bin that declares its interpreter', () => {
    expect(
      binsWithoutShebang({
        manifest,
        readPackedFile: () => '#!/usr/bin/env node\nconsole.log(1);\n',
      }),
    ).toEqual([]);
  });

  it('reports a bin the tarball does not hold at all', () => {
    expect(
      binsWithoutShebang({ manifest, readPackedFile: () => undefined }),
    ).toEqual([expect.stringContaining('has no shebang')]);
  });
});

describe('failureLine', () => {
  it('names the error rather than the version banner', () => {
    const output = [
      'node:internal/modules/esm/resolve:272',
      '    throw new ERR_MODULE_NOT_FOUND(',
      '',
      "Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/x/command-sync.mjs' imported from /x/devkit.mjs",
      '    at finalizeResolution (node:internal/modules/esm/resolve:272:11)',
      'Node.js v26.7.0',
    ].join('\n');

    expect(failureLine(output)).toContain('Cannot find module');
    expect(failureLine(output)).not.toContain('Node.js v');
  });

  it('falls back to the first line when nothing announces itself as an error', () => {
    expect(failureLine('\n  something went wrong\nand more\n')).toBe(
      '  something went wrong',
    );
  });

  it('says so rather than returning nothing for empty output', () => {
    expect(failureLine('')).toBe('no output');
  });
});

describe('materialisationFailure', () => {
  it('reports a kit that placed nothing', () => {
    expect(
      materialisationFailure({ manifestFiles: {}, presentPaths: [] }),
    ).toContain('recorded no files');
  });

  it('reports a record naming a file the tree does not hold', () => {
    expect(
      materialisationFailure({
        manifestFiles: { '.claude/rules/a.md': 'h1', 'docs/b.md': 'h2' },
        presentPaths: ['docs/b.md'],
      }),
    ).toContain('.claude/rules/a.md');
  });

  it('accepts a record whose files are all present', () => {
    expect(
      materialisationFailure({
        manifestFiles: { 'docs/b.md': 'h2' },
        presentPaths: ['docs/b.md', 'package.json'],
      }),
    ).toBeUndefined();
  });

  it('treats an absent record as having placed nothing', () => {
    expect(
      materialisationFailure({ manifestFiles: undefined, presentPaths: [] }),
    ).toContain('recorded no files');
  });
});

describe('noCommandsDeclared', () => {
  it('reports a distributed package that exposes nothing to run', () => {
    expect(noCommandsDeclared({ bin: {}, name: '@scope/kit' })).toContain(
      'declares no bins',
    );
    expect(noCommandsDeclared({ name: '@scope/kit' })).toContain(
      'declares no bins',
    );
  });

  it('accepts a package that declares at least one', () => {
    expect(
      noCommandsDeclared({ bin: { kit: './scripts/kit.mjs' }, name: 'p' }),
    ).toBeUndefined();
  });
});

describe('gateProbeFindings', () => {
  const clean = {
    output: 'No script exits mid-stream.',
    spawned: true,
    status: 0,
  };
  const planted = {
    output: '  - planted-exit.mjs:1  process.exit(1)',
    status: 1,
  };

  it('reports a bin the install did not place', () => {
    expect(
      gateProbeFindings({
        clean: { output: '', spawned: false, status: null },
        name: 'repo-verify-script-exits',
        planted,
        plantedFile: 'planted-exit.mjs',
      }),
    ).toEqual([
      '`repo-verify-script-exits` is not installed in the consumer, so no gate ran through it',
    ]);
  });

  it('reports a bin that fails on a clean consumer', () => {
    const [finding] = gateProbeFindings({
      clean: { output: 'Error: boom', spawned: true, status: 1 },
      name: 'repo-verify-script-exits',
      planted,
      plantedFile: 'planted-exit.mjs',
    });
    expect(finding).toContain('failed on a clean consumer');
    expect(finding).toContain('Error: boom');
  });

  it('reports a bin that passes the planted violation, or fails without naming it', () => {
    const passed = gateProbeFindings({
      clean,
      name: 'repo-verify-script-exits',
      planted: { output: '', status: 0 },
      plantedFile: 'planted-exit.mjs',
    });
    const silent = gateProbeFindings({
      clean,
      name: 'repo-verify-script-exits',
      planted: { output: 'something else broke', status: 1 },
      plantedFile: 'planted-exit.mjs',
    });
    expect(passed).toHaveLength(1);
    expect(passed[0]).toContain('proved nothing');
    expect(silent).toHaveLength(1);
  });

  it('accepts a bin that passes clean and fails naming the planted file', () => {
    expect(
      gateProbeFindings({
        clean,
        name: 'repo-verify-script-exits',
        planted,
        plantedFile: 'planted-exit.mjs',
      }),
    ).toEqual([]);
  });
});
