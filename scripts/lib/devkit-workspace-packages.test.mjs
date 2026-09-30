/*
 * Which packages the created-workspace gate packs, and what it decides from the
 * ranges and the lockfile.
 */

import { describe, expect, it } from 'vite-plus/test';

import {
  catalogsOf,
  missingPackageFindings,
  packageClosure,
  rangeFindings,
  registryResolvedFindings,
  scopedDeclarations,
  scopedNames,
  withTarballOverrides,
} from './devkit-workspace-packages.mjs';

describe('scopedNames', () => {
  it('reads every dependency field and only the @lcabrera scope', () => {
    expect(
      scopedNames({
        dependencies: { '@lcabrera/ui': '1', react: '1' },
        devDependencies: { '@lcabrera/vite-config': 'catalog:stack' },
        peerDependencies: { '@lcabrera/ui': '1' },
      }),
    ).toEqual(['@lcabrera/ui', '@lcabrera/vite-config']);
  });
});

describe('packageClosure', () => {
  const manifests = {
    '@lcabrera/api': { dependencies: { '@lcabrera/utils': 'workspace:*' } },
    '@lcabrera/ui': { peerDependencies: { '@lcabrera/api': 'workspace:*' } },
    '@lcabrera/utils': {},
  };

  it('follows dependencies and peers to every package reached', () => {
    expect(
      packageClosure({
        manifestOf: (name) => manifests[name],
        roots: ['@lcabrera/ui'],
      }),
    ).toEqual({
      missing: [],
      names: ['@lcabrera/api', '@lcabrera/ui', '@lcabrera/utils'],
    });
  });

  it('reports a package this checkout does not hold', () => {
    const { missing } = packageClosure({
      manifestOf: (name) => manifests[name],
      roots: ['@lcabrera/ui', '@lcabrera/gone'],
    });
    expect(missing).toEqual(['@lcabrera/gone']);
    expect(missingPackageFindings(missing)[0]).toContain('`@lcabrera/gone`');
  });
});

const WORKSPACE_YAML = `packages:
  - apps/*
catalogs:
  stack:
    '@lcabrera/vite-config': '>=0.5.0 <1.0.0'
catalog:
  '@lcabrera/utils': ^0.2.0
overrides:
  vite: catalog:build
`;

describe('scopedDeclarations', () => {
  it('resolves a named and a default catalog reference', () => {
    expect(
      scopedDeclarations({
        catalogs: catalogsOf(WORKSPACE_YAML),
        manifests: [
          {
            manifest: {
              dependencies: { '@lcabrera/utils': 'catalog:' },
              devDependencies: { '@lcabrera/vite-config': 'catalog:stack' },
            },
            where: 'root',
          },
        ],
      }).map(({ name, range }) => [name, range]),
    ).toEqual([
      ['@lcabrera/utils', '^0.2.0'],
      ['@lcabrera/vite-config', '>=0.5.0 <1.0.0'],
    ]);
  });
});

describe('rangeFindings', () => {
  const versions = new Map([['@lcabrera/vite-config', '0.6.0']]);
  const declare = (range, specifier = range) => [
    { name: '@lcabrera/vite-config', range, specifier, where: 'root' },
  ];

  it('accepts a range that admits the packed version', () => {
    expect(
      rangeFindings({ declarations: declare('>=0.5.0 <1.0.0'), versions }),
    ).toEqual([]);
  });

  it('names the declaration whose range the packed version misses', () => {
    const [finding] = rangeFindings({
      declarations: declare('^0.5.0'),
      versions,
    });
    expect(finding).toContain('`@lcabrera/vite-config`');
    expect(finding).toContain('0.6.0');
  });

  it('refuses a catalog reference it could not resolve', () => {
    expect(
      rangeFindings({
        declarations: declare(undefined, 'catalog:missing'),
        versions,
      }),
    ).toHaveLength(1);
  });

  it('ignores a package that was not packed', () => {
    expect(
      rangeFindings({ declarations: declare('^9.0.0'), versions: new Map() }),
    ).toEqual([]);
  });
});

describe('withTarballOverrides', () => {
  it('adds each tarball to the existing overrides and keeps the rest', () => {
    const written = withTarballOverrides({
      tarballs: new Map([['@lcabrera/ui', '/tmp/lcabrera-ui-0.8.0.tgz']]),
      workspaceYaml: WORKSPACE_YAML,
    });
    expect(written).toContain(
      "  '@lcabrera/ui': file:/tmp/lcabrera-ui-0.8.0.tgz",
    );
    expect(written).toContain('  vite: catalog:build');
    expect(written).toContain("    '@lcabrera/vite-config': '>=0.5.0 <1.0.0'");
  });
});

const lockfile = (entries) => `---
lockfileVersion: '9.0'

packages:
  pnpm@12.6.0:
    resolution: {integrity: sha512-x}

---
lockfileVersion: '9.0'

packages:
${entries}
`;

describe('registryResolvedFindings', () => {
  it('accepts every @lcabrera package resolved from a file tarball', () => {
    expect(
      registryResolvedFindings(
        lockfile(`  '@lcabrera/ui@file:../pack/lcabrera-ui-0.8.0.tgz':
    resolution: {integrity: sha512-a, tarball: file:../pack/lcabrera-ui-0.8.0.tgz}
  react@19.3.0:
    resolution: {integrity: sha512-b}`),
      ),
    ).toEqual([]);
  });

  it('names an @lcabrera package the registry served', () => {
    const findings = registryResolvedFindings(
      lockfile(`  '@lcabrera/ui@file:../pack/lcabrera-ui-0.8.0.tgz':
    resolution: {integrity: sha512-a, tarball: file:../pack/lcabrera-ui-0.8.0.tgz}
  '@lcabrera/utils@0.2.2':
    resolution: {integrity: sha512-c}`),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('`@lcabrera/utils`');
  });
});
