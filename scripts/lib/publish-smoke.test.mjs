import { describe, expect, it } from 'vite-plus/test';

import {
  importSpecifiers,
  selfContained,
  unimportableProblems,
} from './publish-smoke.mjs';

// What these assertions defend: the consumer smoke run is only evidence if it
// actually imports the subpath that would break. Both selectors below narrow
// what is attempted, and a selector that quietly narrows to nothing is the
// failure this whole gate exists to stop — which is why narrowing all the way
// to zero is itself a reported problem.

const packed = ({ dependencies = {}, exports_ = {}, name }) => ({
  manifest: { dependencies, exports: exports_ },
  name,
});

describe('importSpecifiers', () => {
  it('maps each concrete subpath onto what a consumer would write', () => {
    expect(
      importSpecifiers(
        packed({
          exports_: {
            './b.util': {
              default: './dist/b.util.mjs',
              types: './dist/b.util.d.mts',
            },
          },
          name: '@lcabrera/utils',
        }),
      ),
    ).toEqual(['@lcabrera/utils/b.util']);
  });

  it('attempts a target that still points at TypeScript source', () => {
    // The state an npm-packed tarball is in. Filtering to "looks importable"
    // would skip precisely the entry that fails, and the run would go green.
    expect(
      importSpecifiers(
        packed({
          exports_: { './shared': './src/tsconfig.shared.ts' },
          name: '@lcabrera/tsconfig',
        }),
      ),
    ).toEqual(['@lcabrera/tsconfig/shared']);
  });

  it('skips the manifest, wildcards and linked assets', () => {
    expect(
      importSpecifiers(
        packed({
          exports_: {
            './package.json': './package.json',
            './components/*': './dist/components/*.mjs',
            './reset.css': './dist/reset.css',
          },
          name: '@lcabrera/ui',
        }),
      ),
    ).toEqual([]);
  });
});

describe('selfContained', () => {
  const utils = packed({ name: '@lcabrera/utils' });
  const api = packed({
    dependencies: { '@lcabrera/utils': '0.1.1' },
    name: '@lcabrera/api',
  });
  const server = packed({
    dependencies: { pg: '^8.23.0' },
    name: '@lcabrera/server',
  });

  it('keeps a package whose dependencies are packed alongside it', () => {
    expect(selfContained([utils, api]).map(({ name }) => name)).toEqual([
      '@lcabrera/utils',
      '@lcabrera/api',
    ]);
  });

  it('drops a package that would need a registry', () => {
    expect(selfContained([utils, server]).map(({ name }) => name)).toEqual([
      '@lcabrera/utils',
    ]);
  });

  // The check has to walk the whole closure, not one level. `@lcabrera/vite-config`
  // depends only on `@lcabrera/eslint-plugin`, which is packed — so a direct-only
  // check admits it, and the consumer then dies importing that plugin's own
  // `@typescript-eslint/utils`, which no tarball carries.
  it('drops a package whose packed dependency needs a registry', () => {
    const plugin = packed({
      dependencies: { '@typescript-eslint/utils': '^8.0.0' },
      name: '@lcabrera/eslint-plugin',
    });
    const config = packed({
      dependencies: { '@lcabrera/eslint-plugin': '0.1.0' },
      name: '@lcabrera/vite-config',
    });

    expect(
      selfContained([utils, plugin, config]).map(({ name }) => name),
    ).toEqual(['@lcabrera/utils']);
  });

  it('tolerates a dependency cycle among packed packages', () => {
    const left = packed({ dependencies: { right: '1.0.0' }, name: 'left' });
    const right = packed({ dependencies: { left: '1.0.0' }, name: 'right' });

    expect(selfContained([left, right]).map(({ name }) => name)).toEqual([
      'left',
      'right',
    ]);
  });
});

describe('unimportableProblems', () => {
  // The vacuity this gate would otherwise keep: a package that reaches the
  // consumer lane and contributes no import. The run would print "0 subpath(s)
  // imported" and exit 0 — a cheerful pass over nothing, which is the shape of
  // the defect the whole change is about.
  const lane = ({ name, specifiers }) => ({ packed: { name }, specifiers });

  it('reports a lane package that contributes no specifier', () => {
    expect(
      unimportableProblems([
        lane({ name: '@lcabrera/assets', specifiers: [] }),
      ]).join('\n'),
    ).toContain('@lcabrera/assets');
  });

  it('reports each empty package, not just the first', () => {
    expect(
      unimportableProblems([
        lane({ name: '@lcabrera/a', specifiers: [] }),
        lane({ name: '@lcabrera/b', specifiers: ['@lcabrera/b/x'] }),
        lane({ name: '@lcabrera/c', specifiers: [] }),
      ]),
    ).toHaveLength(2);
  });

  it('says nothing when every lane package imports something', () => {
    expect(
      unimportableProblems([
        lane({ name: '@lcabrera/a', specifiers: ['@lcabrera/a/x'] }),
      ]),
    ).toEqual([]);
  });
});
