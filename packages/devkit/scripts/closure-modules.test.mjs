/*
 * How a module specifier resolves, which is not how a markdown link resolves.
 *
 * A sibling file of `closure.test.mjs` because the two disagree on purpose: a
 * link names a file and an import names a module, so the same string that is an
 * escape in prose is contained in source. Read as a link, every extensionless
 * import in a shipped source tree reported as an escape from the tree holding it.
 */

import { describe, expect, test } from 'vite-plus/test';

import { analyseClosure } from './closure.mjs';

const rootDirectory = '';

const shippedApp = new Set([
  'apps/web/src/constants/app.constants.ts',
  'apps/web/src/index.css',
  'apps/web/src/routes/orders/orders.types.ts',
  'apps/web/src/routes/orders/utils/index.ts',
]);

const escapesFor = (content) =>
  analyseClosure({
    files: [{ content, path: 'apps/web/src/routes/orders/orders.loader.ts' }],
    rootDirectory,
    shipped: shippedApp,
  }).escapes;

describe('a relative import of a shipped module', () => {
  test('resolves through the extension a bundler would have added', () => {
    expect(escapesFor("import type { Order } from './orders.types';")).toEqual(
      [],
    );
  });

  test('resolves a directory to the index file inside it', () => {
    expect(escapesFor("import { toRow } from './utils';")).toEqual([]);
  });

  test('resolves past the query a loader was selected with', () => {
    expect(escapesFor("import href from '../../index.css?url';")).toEqual([]);
  });

  test('is still an escape when nothing shipped answers any spelling of it', () => {
    const [finding] = escapesFor("import { gone } from './orders.absent';");
    expect(finding?.kind).toBe('import');
    expect(finding?.reference).toBe('./orders.absent');
  });
});

describe('the source alias', () => {
  test('resolves against the source root above the importing file', () => {
    expect(
      escapesFor("import { APP_ID } from '@/constants/app.constants';"),
    ).toEqual([]);
  });

  test('is an escape when it names nothing the tree ships', () => {
    const [finding] = escapesFor("import { NOPE } from '@/constants/absent';");
    expect(finding?.kind).toBe('import');
    expect(finding?.reference).toBe('@/constants/absent');
  });

  test('is an escape from a file that sits under no source root', () => {
    const [finding] = analyseClosure({
      files: [
        {
          content: "import { APP_ID } from '@/constants/app.constants';",
          path: 'apps/web/vite.config.ts',
        },
      ],
      rootDirectory,
      shipped: shippedApp,
    }).escapes;
    expect(finding?.reference).toBe('@/constants/app.constants');
  });
});
