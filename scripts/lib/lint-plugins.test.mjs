import { describe, expect, it } from 'vite-plus/test';

import {
  configsDeclaringLint,
  multiplyClassifiedWorkspaces,
  PLUGIN_PROBES,
  pluginsWithoutCoverage,
  probeCode,
  probeFilename,
  silentProbes,
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

describe('silentProbes', () => {
  const probes = [
    { code: '', plugin: 'oxc', rule: 'erasing-op' },
    { code: '', plugin: 'unicorn', rule: 'no-null' },
  ];

  it('reports nothing when every probe fired', () => {
    const reportedCodes = ['oxc(erasing-op)', 'unicorn(no-null)'];
    expect(silentProbes({ probes, reportedCodes })).toEqual([]);
  });

  it('reports the family whose rule did not fire', () => {
    const silent = silentProbes({
      probes,
      reportedCodes: ['oxc(erasing-op)'],
    });
    expect(silent.map(({ plugin }) => plugin)).toEqual(['unicorn']);
  });

  // The regression this whole gate exists for: naming `lint.plugins` replaces
  // Oxlint's default set, so a dropped family reports nothing at all.
  it('reports every family when Oxlint reported nothing', () => {
    expect(silentProbes({ probes, reportedCodes: [] })).toHaveLength(2);
  });

  it('ignores unrelated codes', () => {
    const silent = silentProbes({
      probes,
      reportedCodes: ['eslint(no-debugger)'],
    });
    expect(silent).toHaveLength(2);
  });
});

describe('configsDeclaringLint', () => {
  it('flags a workspace config that declares lint', () => {
    const files = [
      {
        path: 'packages/ui/vite.config.ts',
        text: 'export default {\n  lint: x,\n};',
      },
    ];
    expect(configsDeclaringLint(files)).toEqual(['packages/ui/vite.config.ts']);
  });

  it('exempts the root config, which is the one Vite+ reads', () => {
    const files = [
      { path: 'vite.config.ts', text: '  lint: lintSharedConfig,' },
    ];
    expect(configsDeclaringLint(files)).toEqual([]);
  });

  it('ignores a lint key that is commented out', () => {
    const files = [
      {
        path: 'packages/ui/vite.config.ts',
        text: '  // lint: old,\n  fmt: f,',
      },
      {
        path: 'apps/shared/vite.config.ts',
        text: '  /* lint: old, */\n  fmt: f,',
      },
    ];
    expect(configsDeclaringLint(files)).toEqual([]);
  });

  // `lint:eslint` and friends are run-task names, not a `lint` config block.
  it('does not confuse a lint:* task name for a lint block', () => {
    const files = [
      {
        path: 'packages/ui/vite.config.ts',
        text: "  run: { tasks: { 'lint:eslint': { command: 'eslint .' } } },",
      },
    ];
    expect(configsDeclaringLint(files)).toEqual([]);
  });

  it('leaves a config with no lint key alone', () => {
    const files = [
      { path: 'apps/shared/vite.config.ts', text: '  fmt: fmtConfig,' },
    ];
    expect(configsDeclaringLint(files)).toEqual([]);
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

  // The real gap: the lists were derived from which workspaces had a `lint`
  // block, so several never appeared in any of them.
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
  it('covers a distinct plugin family per probe', () => {
    const plugins = PLUGIN_PROBES.map(({ plugin }) => plugin);
    expect(new Set(plugins).size).toBe(plugins.length);
  });

  it('gives every probe code to violate', () => {
    for (const probe of PLUGIN_PROBES)
      expect(probe.code.length).toBeGreaterThan(0);
  });
});

describe('the react probe', () => {
  it('exists — its rules reach the published @lcabrera/ui package', () => {
    const react = PLUGIN_PROBES.find(({ plugin }) => plugin === 'react');
    expect(react).toBeDefined();
  });

  it('is a .tsx probe, which is load-bearing', () => {
    // The same source saved as `.ts` reports only TypeScript parse errors and
    // no `react(…)` code at all, so a `.ts` probe would pass for the wrong
    // reason — it would go silent whether or not the family were loaded.
    const react = PLUGIN_PROBES.find(({ plugin }) => plugin === 'react');
    expect(react.ext).toBe('tsx');
  });
});

describe('probeFilename', () => {
  it('defaults to .ts when a probe declares no extension', () => {
    expect(probeFilename({ plugin: 'eslint' })).toBe('eslint.probe.ts');
  });

  it('honours an explicit extension', () => {
    expect(probeFilename({ plugin: 'react', ext: 'tsx' })).toBe(
      'react.probe.tsx',
    );
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

  // The regression this exists for: a family added to PLUGINS and left
  // unproven ships green, because a dark family and clean code look identical.
  it('reports a family that is configured but neither probed nor exempt', () => {
    expect(pluginsWithoutCoverage(['eslint', 'jsx_a11y'])).toEqual([
      'jsx_a11y',
    ]);
  });

  it('treats a documented exemption as covered, not as a failure', () => {
    expect(pluginsWithoutCoverage(['import'])).toEqual([]);
  });

  it('gives every exemption a stated reason', () => {
    // An exemption with no reason is indistinguishable from an oversight.
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

  // A workspace in both lists gets rules written on the assumption they never
  // meet, and Biome reports nothing about it either way.
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
        { includes: ['apps/react-router/**', 'packages/ui/**'] },
        { includes: ['**/*.test.ts'] },
        { includes: ['packages/server/**'] },
      ]),
    ).toEqual([
      ['apps/react-router/**', 'packages/ui/**'],
      ['packages/server/**'],
    ]);
  });

  // The reason it matches by shape and not by index: Biome scopes most of its
  // overrides by file pattern, and a roster read positionally would start
  // checking one of those the moment a block is inserted above it.
  it('rejects a block that mixes a workspace glob with a file pattern', () => {
    expect(
      workspaceRosters([{ includes: ['packages/ui/**', '**/routes/**'] }]),
    ).toEqual([]);
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
