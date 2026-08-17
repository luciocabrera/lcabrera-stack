import { describe, expect, it } from 'vite-plus/test';

import {
  auditPackument,
  auditVersion,
  classifyAuditedVersion,
  describeExportPath,
  flattenExportTargets,
  localProtocolProblems,
  manifestProblems,
  renderAudit,
  resolvedNothing,
  selectBroken,
  sourceExportProblems,
  tagsByVersion,
} from './release-audit.mjs';

/**
 * `@lcabrera/eslint-plugin@0.1.0` exactly as the registry serves it — the real
 * broken publish (#730), not an invented shape.
 */
const BROKEN = {
  dependencies: { '@typescript-eslint/utils': 'catalog:lint' },
  devDependencies: { eslint: 'catalog:lint' },
  exports: { '.': './src/index.ts' },
  name: '@lcabrera/eslint-plugin',
  version: '0.1.0',
};

/** The same package at `0.1.1`, published through the pnpm path. */
const CORRECT = {
  dependencies: { '@typescript-eslint/utils': '^8.67.0' },
  exports: {
    '.': { default: './dist/index.mjs', types: './dist/index.d.mts' },
  },
  name: '@lcabrera/eslint-plugin',
  version: '0.1.1',
};

/** `@lcabrera/ui` — ships source deliberately, and is correct doing so. */
const SOURCE_SHIPPING = {
  dependencies: { '@lcabrera/utils': '^0.1.1' },
  exports: { '.': './src/public-api.ts', './hooks/*': './src/hooks/*' },
  name: '@lcabrera/ui',
  version: '0.2.0',
};

describe('flattenExportTargets', () => {
  it('reaches a target behind a subpath and a condition', () => {
    expect(flattenExportTargets(CORRECT.exports)).toEqual([
      { target: './dist/index.mjs', trail: ['.', 'default'] },
      { target: './dist/index.d.mts', trail: ['.', 'types'] },
    ]);
  });

  it('walks an array fallback', () => {
    expect(
      flattenExportTargets({ '.': ['./src/a.ts', './dist/a.mjs'] }),
    ).toEqual([
      { target: './src/a.ts', trail: ['.', '0'] },
      { target: './dist/a.mjs', trail: ['.', '1'] },
    ]);
  });

  it('yields nothing for an absent field or a blocked subpath', () => {
    expect(flattenExportTargets(undefined)).toEqual([]);
    expect(flattenExportTargets({ './internal/*': null })).toEqual([]);
  });
});

describe('describeExportPath', () => {
  it('renders a trail as the manifest lookup that reaches it', () => {
    expect(describeExportPath(['.', 'types'])).toBe('exports["."]["types"]');
  });
});

describe('sourceExportProblems', () => {
  it('reports a target inside src', () => {
    expect(sourceExportProblems(BROKEN)).toHaveLength(1);
    expect(sourceExportProblems(BROKEN)[0]).toContain('./src/index.ts');
  });

  it('accepts a dist target', () => {
    expect(sourceExportProblems(CORRECT)).toEqual([]);
  });
});

describe('localProtocolProblems', () => {
  it('names the install-time consequence for a runtime dependency', () => {
    const [problem] = localProtocolProblems(BROKEN);

    expect(problem).toContain('dependencies["@typescript-eslint/utils"]');
    expect(problem).toContain('EUNSUPPORTEDPROTOCOL');
  });

  it('reports a devDependency without claiming an install failure', () => {
    const problems = localProtocolProblems(BROKEN);
    const dev = problems.find((problem) =>
      problem.startsWith('devDependencies'),
    );

    expect(dev).toContain('unsubstituted pnpm protocol');
    expect(dev).not.toContain('EUNSUPPORTEDPROTOCOL');
  });

  it('reports a workspace range', () => {
    expect(
      localProtocolProblems({
        dependencies: { '@lcabrera/utils': 'workspace:*' },
      }),
    ).toHaveLength(1);
  });

  it('accepts a resolved semver range', () => {
    expect(localProtocolProblems(CORRECT)).toEqual([]);
  });
});

describe('manifestProblems', () => {
  it('finds both defects in the real broken manifest', () => {
    expect(
      manifestProblems({ manifest: BROKEN, shipsSource: false }),
    ).toHaveLength(3);
  });

  it('finds nothing in the corrected one', () => {
    expect(manifestProblems({ manifest: CORRECT, shipsSource: false })).toEqual(
      [],
    );
  });

  it('allows src exports for a package that ships source', () => {
    // The discriminating case: `@lcabrera/ui`'s src targets are the intended
    // surface, so a blanket "no ./src/" rule would fail a correct artifact.
    expect(
      manifestProblems({ manifest: SOURCE_SHIPPING, shipsSource: true }),
    ).toEqual([]);
    expect(
      manifestProblems({ manifest: SOURCE_SHIPPING, shipsSource: false }),
    ).toHaveLength(2);
  });

  it('still rejects a local protocol in a source-shipping package', () => {
    expect(
      manifestProblems({
        manifest: { ...SOURCE_SHIPPING, dependencies: { x: 'workspace:*' } },
        shipsSource: true,
      }),
    ).toHaveLength(1);
  });
});

describe('classifyAuditedVersion', () => {
  const problems = ['something'];

  it('passes a version with no problems', () => {
    expect(
      classifyAuditedVersion({ deprecated: false, problems: [], tags: [] }),
    ).toBe('clean');
  });

  it('fails an untagged, undeprecated defect', () => {
    expect(
      classifyAuditedVersion({ deprecated: false, problems, tags: [] }),
    ).toBe('broken');
  });

  it('discharges a superseded defect once it is deprecated', () => {
    expect(
      classifyAuditedVersion({ deprecated: true, problems, tags: [] }),
    ).toBe('deprecated');
  });

  it('never discharges a version a dist-tag still points at', () => {
    // Deprecation warns but does not unpublish: `npm install <name>` still
    // resolves to `latest`, so the consumer gets the broken artifact anyway.
    expect(
      classifyAuditedVersion({
        deprecated: true,
        problems,
        tags: ['latest'],
      }),
    ).toBe('broken');
  });
});

describe('auditVersion', () => {
  it('reads deprecation off the published manifest', () => {
    const audited = auditVersion({
      manifest: { ...BROKEN, deprecated: 'use 0.1.1' },
      shipsSource: false,
      tags: [],
      version: '0.1.0',
    });

    expect(audited.deprecated).toBe(true);
    expect(audited.state).toBe('deprecated');
  });
});

describe('tagsByVersion', () => {
  it('groups every tag pointing at the same version', () => {
    expect(
      tagsByVersion({ latest: '0.1.1', next: '0.1.1', old: '0.1.0' }),
    ).toEqual(
      new Map([
        ['0.1.1', ['latest', 'next']],
        ['0.1.0', ['old']],
      ]),
    );
  });

  it('tolerates a packument with no dist-tags', () => {
    expect(tagsByVersion()).toEqual(new Map());
  });
});

const PACKUMENT = {
  'dist-tags': { latest: '0.1.1' },
  versions: { '0.1.0': BROKEN, '0.1.1': CORRECT },
};

describe('auditPackument', () => {
  it('sweeps every published version, not only latest', () => {
    const versions = auditPackument({
      packument: PACKUMENT,
      shipsSource: false,
    });

    expect(versions.map(({ state, version }) => [version, state])).toEqual([
      ['0.1.0', 'broken'],
      ['0.1.1', 'clean'],
    ]);
  });

  it('narrows to one version when asked', () => {
    expect(
      auditPackument({
        only: '0.1.0',
        packument: PACKUMENT,
        shipsSource: false,
      }).map(({ version }) => version),
    ).toEqual(['0.1.0']);
  });

  it('yields nothing for a version that was never published', () => {
    expect(
      auditPackument({
        only: '9.9.9',
        packument: PACKUMENT,
        shipsSource: false,
      }),
    ).toEqual([]);
  });
});

describe('selectBroken', () => {
  it('names package and version for each failure', () => {
    const audited = [
      {
        name: '@lcabrera/eslint-plugin',
        published: true,
        versions: auditPackument({ packument: PACKUMENT, shipsSource: false }),
      },
    ];

    expect(selectBroken(audited)).toEqual(['@lcabrera/eslint-plugin@0.1.0']);
  });
});

describe('resolvedNothing', () => {
  const resolved = { name: '@lcabrera/utils', published: true, versions: [] };
  const missing = { name: '@lcabrera/new', published: false, versions: [] };

  it('fires when every package the run asked about was a 404', () => {
    // A registry answering 404 to everything — a proxy, a wrong
    // `npm_config_registry`, an auth failure serving 404 instead of 401 —
    // otherwise reports "audited every package, all clean" having read nothing.
    expect(resolvedNothing([missing, missing, missing])).toBe(true);
  });

  it('tolerates one package awaiting its first publish', () => {
    // The state this must NOT fail: a 404 is an answer for a package that has
    // simply not shipped yet, which is why the sweep survives one.
    expect(resolvedNothing([resolved, missing])).toBe(false);
  });

  it('does not fire on a run that asked about nothing', () => {
    // No targets is not blindness — there was no question to answer.
    expect(resolvedNothing([])).toBe(false);
  });

  it('fires on a single explicit spec that resolved to nothing', () => {
    expect(resolvedNothing([missing])).toBe(true);
  });
});

describe('renderAudit', () => {
  const audited = [
    {
      name: '@lcabrera/eslint-plugin',
      published: true,
      versions: auditPackument({ packument: PACKUMENT, shipsSource: false }),
    },
    { name: '@lcabrera/new', published: false, versions: [] },
    { name: '@lcabrera/known', published: true, versions: [] },
  ];
  const report = renderAudit({ audited, registry: 'https://example.test' });

  it('lists the clean versions too, so a dropped package is visible', () => {
    expect(report).toContain('✓ 0.1.1 (latest)');
  });

  it('lists every problem on a broken version', () => {
    expect(report).toContain('✗ 0.1.0');
    expect(report).toContain('EUNSUPPORTEDPROTOCOL');
  });

  it('distinguishes a package that is not published from a missing version', () => {
    expect(report).toContain('@lcabrera/new\n  — not on npm');
    expect(report).toContain('@lcabrera/known\n  — no such version on npm');
  });
});
