import { describe, expect, it } from 'vite-plus/test';

import {
  familyPlacements,
  mergePlacements,
  multiplyClassifiedWorkspaces,
  PLUGIN_PROBES,
  pluginsWithoutCoverage,
  probeCode,
  probeFilename,
  RULE_PROBES,
  silentPlacements,
  staleRuntimeGlobs,
  unclassifiedWorkspaces,
  UNPROBED_PLUGINS,
  workspaceRosters,
} from './lint-plugins.mjs';

describe('probeCode', () => {
  it('formats a probe as the code Oxlint prints', () => {
    expect(probeCode({ plugin: 'unicorn', rule: 'no-null' })).toBe(
      'unicorn(no-null)',
    );
  });
});

describe('probeCode with a scope', () => {
  it('prints the scope Oxlint reports instead of the family', () => {
    expect(
      probeCode({
        plugin: 'react',
        rule: 'exhaustive-deps',
        scope: 'react-hooks',
      }),
    ).toBe('react-hooks(exhaustive-deps)');
  });
});

describe('silentPlacements', () => {
  const placements = [
    {
      path: 'p/oxc.erasing-op.probe.ts',
      probe: { plugin: 'oxc', rule: 'erasing-op' },
    },
    {
      path: 'scripts/p/unicorn.no-null.override-0.probe.ts',
      probe: { plugin: 'unicorn', rule: 'no-null' },
    },
  ];
  const fired = [
    { code: 'oxc(erasing-op)', filename: 'p/oxc.erasing-op.probe.ts' },
    {
      code: 'unicorn(no-null)',
      filename: './scripts/p/unicorn.no-null.override-0.probe.ts',
    },
  ];

  it('reports nothing when every probe fired in its own file', () => {
    expect(silentPlacements({ diagnostics: fired, placements })).toEqual([]);
  });

  it('reports the probe whose rule did not fire', () => {
    const silent = silentPlacements({
      diagnostics: fired.slice(0, 1),
      placements,
    });
    expect(silent.map(({ probe }) => probe.rule)).toEqual(['no-null']);
  });

  it('does not count the code when another file reported it', () => {
    const silent = silentPlacements({
      diagnostics: [
        { code: 'unicorn(no-null)', filename: 'p/oxc.erasing-op.probe.ts' },
        fired[0],
      ],
      placements,
    });
    expect(silent).toHaveLength(1);
  });

  it('reports every probe when Oxlint reported nothing', () => {
    expect(silentPlacements({ diagnostics: [], placements })).toHaveLength(2);
  });
});

describe('familyPlacements', () => {
  it('puts every family probe in the probe directory under its own name', () => {
    expect(familyPlacements('d').map(({ path }) => path)).toEqual(
      PLUGIN_PROBES.map((probe) => `d/${probeFilename(probe)}`),
    );
  });
});

describe('mergePlacements', () => {
  it('keeps one placement per path and the rule that named it', () => {
    const probe = { plugin: 'promise', rule: 'no-callback-in-promise' };
    const named = { entry: 'rules', id: 'promise/no-callback-in-promise' };
    expect(
      mergePlacements([
        { path: 'd/a.ts', probe, root: 'd' },
        { named, path: 'd/a.ts', probe, root: 'd' },
      ]),
    ).toEqual([{ named, path: 'd/a.ts', probe, root: 'd' }]);
  });
});

describe('unclassifiedWorkspaces', () => {
  const runtimes = {
    agnostic: ['packages/utils/**'],
    browser: ['packages/ui/**'],
    node: ['packages/server/**'],
  };

  it('accepts a fully classified tree', () => {
    const workspaces = ['packages/ui', 'packages/server', 'packages/utils'];
    expect(unclassifiedWorkspaces({ runtimes, workspaces })).toEqual([]);
  });

  it('reports a workspace named in no list', () => {
    const workspaces = ['packages/ui', 'packages/server', 'packages/api'];
    expect(unclassifiedWorkspaces({ runtimes, workspaces })).toEqual([
      'packages/api',
    ]);
  });

  it('counts the agnostic list as classification, not as an omission', () => {
    expect(
      unclassifiedWorkspaces({ runtimes, workspaces: ['packages/utils'] }),
    ).toEqual([]);
  });

  it('reports every unclassified workspace, not just the first', () => {
    const workspaces = ['packages/api', 'packages/plugins'];
    expect(unclassifiedWorkspaces({ runtimes, workspaces })).toHaveLength(2);
  });
});

describe('staleRuntimeGlobs', () => {
  it('reports a glob whose workspace is gone', () => {
    const runtimes = { agnostic: [], browser: [], node: ['packages/old/**'] };
    expect(
      staleRuntimeGlobs({ runtimes, workspaces: ['packages/ui'] }),
    ).toEqual(['packages/old/**']);
  });

  it('stays quiet when every glob resolves', () => {
    const runtimes = { agnostic: [], browser: ['packages/ui/**'], node: [] };
    expect(
      staleRuntimeGlobs({ runtimes, workspaces: ['packages/ui'] }),
    ).toEqual([]);
  });
});

describe('PLUGIN_PROBES', () => {
  it('gives every probe its own file and its own diagnostic code', () => {
    const all = [...PLUGIN_PROBES, ...RULE_PROBES];
    const files = all.map((probe) => probeFilename(probe));
    const codes = all.map((probe) => probeCode(probe));
    expect(new Set(files).size).toBe(all.length);
    expect(new Set(codes).size).toBe(all.length);
  });

  it.each([
    'react-hooks(exhaustive-deps)',
    'react(exhaustive-effect-dependencies)',
  ])('proves %s fires, not only that react loads', (code) => {
    expect(PLUGIN_PROBES.map((probe) => probeCode(probe))).toContain(code);
  });

  it('gives every probe code to violate', () => {
    for (const probe of [...PLUGIN_PROBES, ...RULE_PROBES])
      expect(probe.code.length).toBeGreaterThan(0);
  });
});

describe('the react probe', () => {
  it('exists — its rules reach the published @lcabrera/ui package', () => {
    const react = PLUGIN_PROBES.find(({ plugin }) => plugin === 'react');
    expect(react).toBeDefined();
  });

  it('is a .tsx probe, which is load-bearing', () => {
    const react = PLUGIN_PROBES.filter(({ plugin }) => plugin === 'react');
    expect(react.map(({ ext }) => ext)).toEqual(react.map(() => 'tsx'));
  });
});

describe('probeFilename', () => {
  it('defaults to .ts when a probe declares no extension', () => {
    expect(probeFilename({ plugin: 'eslint', rule: 'no-debugger' })).toBe(
      'eslint.no-debugger.probe.ts',
    );
  });

  it('names the file after the scope when a probe has one', () => {
    expect(
      probeFilename({
        ext: 'tsx',
        plugin: 'react',
        rule: 'exhaustive-deps',
        scope: 'react-hooks',
      }),
    ).toBe('react-hooks.exhaustive-deps.probe.tsx');
  });

  it('honours an explicit extension', () => {
    expect(
      probeFilename({ ext: 'tsx', plugin: 'react', rule: 'no-children-prop' }),
    ).toBe('react.no-children-prop.probe.tsx');
  });
});

describe('pluginsWithoutCoverage', () => {
  it('is empty when every configured family is probed or exempt', () => {
    const configured = [
      ...PLUGIN_PROBES.map(({ plugin }) => plugin),
      ...Object.keys(UNPROBED_PLUGINS),
    ];
    expect(pluginsWithoutCoverage(configured)).toEqual([]);
  });

  it('reports a family that is configured but neither probed nor exempt', () => {
    expect(pluginsWithoutCoverage(['eslint', 'jsx_a11y'])).toEqual([
      'jsx_a11y',
    ]);
  });

  it('treats a documented exemption as covered, not as a failure', () => {
    expect(pluginsWithoutCoverage(['import'])).toEqual([]);
  });

  it('gives every exemption a stated reason', () => {
    for (const reason of Object.values(UNPROBED_PLUGINS))
      expect(reason.length).toBeGreaterThan(0);
  });
});

describe('multiplyClassifiedWorkspaces', () => {
  it('is empty when every workspace is in exactly one list', () => {
    expect(
      multiplyClassifiedWorkspaces({
        runtimes: { browser: ['packages/ui/**'], node: ['packages/server/**'] },
        workspaces: ['packages/ui', 'packages/server'],
      }),
    ).toEqual([]);
  });

  it('reports a workspace claimed by two lists', () => {
    expect(
      multiplyClassifiedWorkspaces({
        runtimes: {
          browser: ['packages/ui/**'],
          node: ['packages/ui/**', 'packages/server/**'],
        },
        workspaces: ['packages/ui', 'packages/server'],
      }),
    ).toEqual(['packages/ui']);
  });

  it('ignores a duplicate glob naming no workspace', () => {
    expect(
      multiplyClassifiedWorkspaces({
        runtimes: { a: ['apps/gone/**'], b: ['apps/gone/**'] },
        workspaces: ['packages/ui'],
      }),
    ).toEqual([]);
  });
});

describe('workspaceRosters', () => {
  it('picks the blocks whose every glob names a whole workspace', () => {
    expect(
      workspaceRosters([
        { includes: ['apps/showcase/**', 'packages/ui/**'] },
        { includes: ['**/*.test.ts'] },
        { includes: ['packages/server/**'] },
      ]),
    ).toEqual([['apps/showcase/**', 'packages/ui/**'], ['packages/server/**']]);
  });

  it('rejects a block that mixes a workspace glob with a file pattern', () => {
    expect(
      workspaceRosters([{ includes: ['packages/ui/**', '**/routes/**'] }]),
    ).toEqual([]);
  });

  it('excludes a block that is a subset of another', () => {
    expect(
      workspaceRosters([
        { includes: ['apps/showcase/**'] },
        { includes: ['packages/server/**', 'packages/ui/**'] },
        { includes: ['packages/server/**'] },
      ]),
    ).toEqual([['apps/showcase/**'], ['packages/server/**', 'packages/ui/**']]);
  });

  it('keeps two blocks that merely overlap, since neither is contained', () => {
    expect(
      workspaceRosters([
        { includes: ['packages/a/**', 'packages/b/**'] },
        { includes: ['packages/b/**', 'packages/c/**'] },
      ]),
    ).toHaveLength(2);
  });

  it('ignores a nested path, which scopes below a workspace', () => {
    expect(workspaceRosters([{ includes: ['packages/ui/src/**'] }])).toEqual(
      [],
    );
  });

  it('skips a block with no includes at all', () => {
    expect(workspaceRosters([{ linter: {} }, { includes: [] }])).toEqual([]);
  });
});
