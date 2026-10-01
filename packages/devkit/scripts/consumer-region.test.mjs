/*
 * The splitter behind the region a consumer owns, held to the shapes the
 * package manager writes, and the shipped workspace file held to carrying no
 * region of its own — if it did, the kit's entries would read as the consumer's.
 *
 * Usage: `vp run test` in this workspace; exits non-zero on a failing case.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vite-plus/test';

import {
  consumerRegionKey,
  joinConsumerRegion,
  splitConsumerRegion,
} from './consumer-region.mjs';

const WORKSPACE_ASSET = 'workspace/pnpm-workspace.yaml';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const shipped = readFileSync(
  join(packageRoot, 'assets', WORKSPACE_ASSET),
  'utf8',
);

const KIT = [
  'packages:',
  '  - apps/*',
  '',
  'catalogs:',
  '  build:',
  '    typescript: ^6.0.3',
  '',
  'catalogMode: prefer',
  '',
].join('\n');

const split = (content) => splitConsumerRegion({ content, key: 'catalog' });

describe('consumerRegionKey', () => {
  test('gives the workspace file its default catalog, and no other asset a region', () => {
    expect(consumerRegionKey(WORKSPACE_ASSET)).toBe('catalog');
    expect(consumerRegionKey('root/COMMANDS.md')).toBeUndefined();
  });

  test('names a key the shipped workspace file does not carry', () => {
    expect(split(shipped)).toEqual({ kit: shipped, region: '' });
  });
});

describe('splitConsumerRegion', () => {
  test('takes off the block the package manager appends, and leaves the kit byte for byte', () => {
    const appended = `${KIT}\ncatalog:\n  is-number: ^7.0.0\n  is-odd: ^3.0.1\n`;

    expect(split(appended)).toEqual({
      kit: KIT,
      region: 'catalog:\n  is-number: ^7.0.0\n  is-odd: ^3.0.1',
    });
  });

  test('takes a block written between two kit keys, with the comment above it', () => {
    const between = KIT.replace(
      'catalogMode',
      '# ours\ncatalog:\n  zod: ^4.6.5\n\ncatalogMode',
    );

    expect(split(between)).toEqual({
      kit: KIT,
      region: '# ours\ncatalog:\n  zod: ^4.6.5',
    });
  });

  test('takes a block written at the top of the file', () => {
    expect(split(`catalog:\n  zod: ^4.6.5\n\n${KIT}`)).toEqual({
      kit: KIT,
      region: 'catalog:\n  zod: ^4.6.5',
    });
  });

  test('leaves an entry added to a named catalog in the kit, where it reads as an edit', () => {
    const named = KIT.replace(
      '    typescript: ^6.0.3',
      '    typescript: ^6.0.3\n    zod: ^4.6.5',
    );

    expect(split(named)).toEqual({ kit: named, region: '' });
  });

  test('does not read the named catalogs key as the default one', () => {
    expect(split(KIT).region).toBe('');
  });
});

describe('joinConsumerRegion', () => {
  test('puts a region back so the next split recovers the kit unchanged', () => {
    const region = 'catalog:\n  is-odd: ^3.0.1';
    const joined = joinConsumerRegion({ kit: KIT, region });

    expect(joined).toBe(`${KIT}\ncatalog:\n  is-odd: ^3.0.1\n`);
    expect(split(joined)).toEqual({ kit: KIT, region });
  });

  test('writes the kit alone when the consumer holds no region', () => {
    expect(joinConsumerRegion({ kit: KIT })).toBe(KIT);
  });
});
