import { describe, expect, it } from 'vite-plus/test';

import {
  configsDeclaringLint,
  PLUGIN_PROBES,
  probeCode,
  silentProbes,
  staleRuntimeGlobs,
  unclassifiedWorkspaces,
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
