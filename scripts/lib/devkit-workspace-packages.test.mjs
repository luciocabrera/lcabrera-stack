/*
 * Which packages the created-workspace gate packs, and what it decides from the
 * ranges and the lockfile.
 */

import { describe, expect, it } from 'vite-plus/test';

import {
  catalogsOf,
  digestsOf,
  missingPackageFindings,
  packageClosure,
  packumentFor,
  rangeFindings,
  scopedDeclarations,
  scopedNames,
  scopedRegistryConfig,
  unpackedSourceFindings,
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

  it("does not follow a reached package's devDependencies, which a consumer never installs", () => {
    expect(
      packageClosure({
        manifestOf: (name) =>
          ({
            '@lcabrera/api': {
              devDependencies: { '@lcabrera/server': 'workspace:*' },
            },
          })[name],
        roots: ['@lcabrera/api'],
      }),
    ).toEqual({ missing: [], names: ['@lcabrera/api'] });
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

describe('digestsOf', () => {
  it('gives the sha512 integrity and sha1 shasum npm publishes', () => {
    expect(digestsOf(new TextEncoder().encode('abc'))).toEqual({
      integrity:
        'sha512-3a81oZNherrMQXNJriBBMRLm+k6JqX6iCp7u5ktV05ohkpkqJ0/BqDa6PCOj/uu9RU1EI2Q86A4qmslPpUyknw==',
      shasum: 'a9993e364706816aba3e25717850c26c9cd0d89d',
    });
  });
});

describe('packumentFor', () => {
  it('serves the packed manifest as its only version, with a tarball on the registry', () => {
    const packument = packumentFor({
      baseUrl: 'http://127.0.0.1:4873',
      packed: {
        file: 'lcabrera-ui-0.8.0.tgz',
        integrity: 'sha512-x',
        manifest: { name: '@lcabrera/ui', version: '0.8.0' },
        shasum: 'y',
      },
    });
    expect(packument['dist-tags']).toEqual({ latest: '0.8.0' });
    expect(packument.versions['0.8.0'].dist).toEqual({
      integrity: 'sha512-x',
      shasum: 'y',
      tarball: 'http://127.0.0.1:4873/-/lcabrera-ui-0.8.0.tgz',
    });
  });
});

describe('scopedRegistryConfig', () => {
  it('points only the @lcabrera scope at the scratch registry', () => {
    expect(scopedRegistryConfig('http://127.0.0.1:4873')).toBe(
      '@lcabrera:registry=http://127.0.0.1:4873/\n',
    );
  });
});

const REGISTRY = 'http://127.0.0.1:4873';

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

const PACKED = new Map([
  ['@lcabrera/ui', { integrity: 'sha512-a', version: '0.8.0' }],
]);

const FROM_SCRATCH = `  '@lcabrera/ui@0.8.0':
    resolution: {integrity: sha512-a, tarball: ${REGISTRY}/-/lcabrera-ui-0.8.0.tgz}
  react@19.3.0:
    resolution: {integrity: sha512-b}`;

describe('unpackedSourceFindings', () => {
  it('accepts every @lcabrera package the scratch registry served from the packed tarball', () => {
    expect(
      unpackedSourceFindings({
        lockfile: lockfile(FROM_SCRATCH),
        packed: PACKED,
        registry: REGISTRY,
      }),
    ).toEqual([]);
  });

  it('names a package npm served even when its bytes match the packed ones', () => {
    const [finding] = unpackedSourceFindings({
      lockfile: lockfile(`  '@lcabrera/ui@0.8.0':
    resolution: {integrity: sha512-a}`),
      packed: PACKED,
      registry: REGISTRY,
    });
    expect(finding).toContain('`@lcabrera/ui@0.8.0`');
  });

  it('names a package that was never packed', () => {
    const findings = unpackedSourceFindings({
      lockfile: lockfile(`${FROM_SCRATCH}
  '@lcabrera/utils@0.2.2':
    resolution: {integrity: sha512-c}`),
      packed: PACKED,
      registry: REGISTRY,
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('`@lcabrera/utils@0.2.2`');
  });

  it('names a package whose integrity is not the packed one', () => {
    expect(
      unpackedSourceFindings({
        lockfile: lockfile(`  '@lcabrera/ui@0.8.0':
    resolution: {integrity: sha512-z, tarball: ${REGISTRY}/-/lcabrera-ui-0.8.0.tgz}`),
        packed: PACKED,
        registry: REGISTRY,
      }),
    ).toHaveLength(1);
  });
});
