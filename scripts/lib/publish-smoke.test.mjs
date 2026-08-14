import { describe, expect, it } from 'vite-plus/test';

import { importSpecifiers, selfContained } from './publish-smoke.mjs';

// What these assertions defend: the consumer smoke run is only evidence if it
// actually imports the subpath that would break. Both selectors below narrow
// what is attempted, and a selector that quietly narrows to nothing is the
// failure this whole gate exists to stop.

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
});
