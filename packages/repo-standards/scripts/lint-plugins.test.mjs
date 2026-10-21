import { describe, expect, it } from 'vite-plus/test';

import {
  configsDeclaringKeys,
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

describe('configsDeclaringKeys', () => {
  const KEYS = ['lint', 'fmt', 'staged'];
  const PATH = 'packages/ui/vite.config.ts';
  const declared = (text) => configsDeclaringKeys([{ path: PATH, text }], KEYS);

  describe.each(KEYS)('the %s key', (key) => {
    it.each([
      [
        'at the start of a line',
        `export default defineConfig({\n  ${key}: x,\n});`,
      ],
      ['inline', `export default defineConfig({ ${key}: x });`],
      [
        'as a shorthand property on its own line',
        `const ${key} = {};\nexport default defineConfig({\n  ${key},\n});`,
      ],
      [
        'as an inline shorthand property',
        `const ${key} = {};\nexport default defineConfig({ ${key} });`,
      ],
      ['as a quoted key', `export default defineConfig({ '${key}': x });`],
      [
        'through a spread of a local object',
        `const base = { ${key}: x };\nexport default defineConfig({ ...base, test: t });`,
      ],
      [
        'in an object a local constant holds',
        `const config = { ${key}: x };\nexport default defineConfig(config);`,
      ],
      [
        'in the object a config function returns',
        `export default defineConfig(() => ({ ${key}: x }));`,
      ],
      ['in a default-exported object', `export default { ${key}: x };`],
    ])('flags it declared %s', (_form, text) => {
      expect(declared(text)).toEqual([{ key, path: PATH }]);
    });

    it('exempts the root config, which is the one Vite+ reads', () => {
      const files = [
        {
          path: 'vite.config.ts',
          text: `export default defineConfig({ ${key}: rootConfig });`,
        },
      ];
      expect(configsDeclaringKeys(files, KEYS)).toEqual([]);
    });

    it('ignores the key when it is commented out', () => {
      expect(
        declared(
          `export default defineConfig({\n  // ${key}: old,\n  test: t,\n});`,
        ),
      ).toEqual([]);
      expect(
        declared(
          `export default defineConfig({\n  /*\n  ${key}: old,\n  */\n  test: t,\n});`,
        ),
      ).toEqual([]);
    });

    it('does not flag a nested property with the same name', () => {
      expect(
        declared(
          `const ${key} = {};\nexport default defineConfig({\n  test: { ${key}: x },\n  run: { ${key} },\n});`,
        ),
      ).toEqual([]);
    });

    it('does not confuse a task name for the block', () => {
      expect(
        declared(
          `export default defineConfig({ run: { tasks: { '${key}:check': { command: 'x' } } } });`,
        ),
      ).toEqual([]);
    });

    it('does not follow a spread of an imported object', () => {
      expect(
        declared(
          `import { base } from './base.ts';\nexport default defineConfig({ ...base });`,
        ),
      ).toEqual([]);
    });
  });

  it('terminates on objects that spread each other', () => {
    expect(
      declared(
        'const a = { ...b, lint: x };\nconst b = { ...a };\nexport default defineConfig(a);',
      ),
    ).toEqual([{ key: 'lint', path: PATH }]);
  });

  it('reports every key a config declares, in the order asked', () => {
    const files = [
      {
        path: 'apps/docs-site/vite.config.ts',
        text: 'export default defineConfig({\n  staged: s,\n  fmt: f,\n  test: t,\n});',
      },
    ];
    expect(configsDeclaringKeys(files, KEYS)).toEqual([
      { key: 'fmt', path: 'apps/docs-site/vite.config.ts' },
      { key: 'staged', path: 'apps/docs-site/vite.config.ts' },
    ]);
  });

  it('checks only the keys it is given', () => {
    const files = [
      {
        path: 'apps/docs-site/vite.config.ts',
        text: 'export default defineConfig({ fmt: fmtConfig });',
      },
    ];
    expect(configsDeclaringKeys(files, ['lint'])).toEqual([]);
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
    const files = PLUGIN_PROBES.map((probe) => probeFilename(probe));
    const codes = PLUGIN_PROBES.map((probe) => probeCode(probe));
    expect(new Set(files).size).toBe(PLUGIN_PROBES.length);
    expect(new Set(codes).size).toBe(PLUGIN_PROBES.length);
  });

  it('proves the effect-dependency rule fires, not only that react loads', () => {
    expect(PLUGIN_PROBES.map((probe) => probeCode(probe))).toContain(
      'react-hooks(exhaustive-deps)',
    );
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
    const react = PLUGIN_PROBES.filter(({ plugin }) => plugin === 'react');
    expect(react.map(({ ext }) => ext)).toEqual(react.map(() => 'tsx'));
  });
});

describe('probeFilename', () => {
  it('defaults to .ts when a probe declares no extension', () => {
    expect(probeFilename({ plugin: 'eslint' })).toBe('eslint.probe.ts');
  });

  it('names the file after the scope when a probe has one', () => {
    expect(
      probeFilename({ ext: 'tsx', plugin: 'react', scope: 'react-hooks' }),
    ).toBe('react-hooks.probe.tsx');
  });

  it('honours an explicit extension', () => {
    expect(probeFilename({ ext: 'tsx', plugin: 'react' })).toBe(
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
