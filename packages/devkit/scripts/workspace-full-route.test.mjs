/*
 * The orders route the `full` rung places over the one the `monorepo` rung
 * emits, checked as the tree a consumer receives: the full rung's files on top
 * of the lower rung's, less the ones it retires. A route module nothing
 * declares, a declared module no rung ships, a retired file something still
 * imports, or an application with no test task each reach a consumer without a
 * failing build.
 */

import { createReactRouterRunConfig } from '@lcabrera/vite-config/run';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vite-plus/test';

import { retiredAssetsFor } from './config.mjs';
import { readFilesUnder } from './files.mjs';

const ASSETS = join(dirname(dirname(fileURLToPath(import.meta.url))), 'assets');

const APP_SOURCE = 'apps/web/src';

const ROUTE_LIMIT = 25;

const RETIRED_ROWS = 'workspace/apps/web/src/routes/orders/orders.rows.ts';

const sourceOf = (group) =>
  readFilesUnder({
    directory: join(ASSETS, group, APP_SOURCE),
    root: join(ASSETS, group),
  }).map((file) => ({ ...file, assetPath: `${group}/${file.path}` }));

const retired = new Set(retiredAssetsFor({ profile: 'full' }));

const placedAtFull = () => {
  const higher = sourceOf('full');
  const shadowed = new Set(higher.map((file) => file.path));
  const lower = sourceOf('workspace').filter(
    (file) => !shadowed.has(file.path) && !retired.has(file.assetPath),
  );
  return [...higher, ...lower];
};

const appPath = (path) => path.slice(`${APP_SOURCE}/`.length);

const declaredModules = () => {
  const routes = placedAtFull().find(
    (file) => appPath(file.path) === 'routes.ts',
  );
  return (routes?.content ?? '')
    .matchAll(/'(routes\/[^']+)'/g)
    .map((match) => match[1])
    .toArray();
};

const isRouteFile = (path) =>
  path.startsWith('routes/orders/') || path.startsWith('routes/api/orders-');

describe('the route the full rung places', () => {
  test('declares only route modules the tree holds', () => {
    const held = new Set(placedAtFull().map((file) => appPath(file.path)));
    const missing = declaredModules().filter((module) => !held.has(module));
    expect(declaredModules().length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });

  test('leaves no route module it ships undeclared', () => {
    const declared = new Set(declaredModules());
    const undeclared = placedAtFull()
      .map((file) => appPath(file.path))
      .filter((path) => path.endsWith('/root.ts'))
      .filter((path) => !declared.has(path));
    expect(undeclared).toEqual([]);
  });

  test(`is fewer than ${ROUTE_LIMIT} files`, () => {
    const files = placedAtFull()
      .map((file) => appPath(file.path))
      .filter((path) => isRouteFile(path));
    expect(files.length).toBeGreaterThan(0);
    expect(files.length).toBeLessThan(ROUTE_LIMIT);
  });

  test('reads through the published table-page primitives', () => {
    const imports = placedAtFull()
      .map((file) => file.content)
      .join('\n');
    for (const primitive of [
      '@lcabrera/server/table-page/create-table-page-reader.util',
      '@lcabrera/server/table-page/create-table-loader-reads.util',
      '@lcabrera/server/table-page/create-table-page-loader.util',
      '@lcabrera/server/table-page/create-group-detail-reads.util',
      '@lcabrera/server/table-page/create-row-delete-action.util',
      '@lcabrera/api/table-page/is-table-page-response.util',
    ]) {
      expect(imports).toContain(primitive);
    }
  });
});

describe('the files the full rung retires', () => {
  test('include the rows the lower rung renders from', () => {
    expect([...retired]).toContain(RETIRED_ROWS);
  });

  test('each name a file the lower rung ships', () => {
    const absent = [...retired].filter(
      (assetPath) => !existsSync(join(ASSETS, ...assetPath.split('/'))),
    );
    expect(absent).toEqual([]);
  });

  test('are imported by nothing the full rung places', () => {
    const importers = placedAtFull()
      .filter((file) =>
        [...retired].some((assetPath) => {
          const module = assetPath.split('/').at(-1).replace(/\.ts$/, '');
          return file.content.includes(`/${module}'`);
        }),
      )
      .map((file) => file.path);
    expect(importers).toEqual([]);
  });

  test('stay placed below the full rung', () => {
    expect(retiredAssetsFor({ profile: 'monorepo' })).toEqual([]);
  });
});

describe('the application the rung places runs its route tests', () => {
  test('wires the run configuration that declares its test task', () => {
    const config = readFileSync(
      join(ASSETS, 'workspace', 'apps', 'web', 'vite.config.ts'),
      'utf8',
    );
    expect(config).toMatch(/run: createReactRouterRunConfig\(\)/);
  });

  test('and that task runs the test runner over the application', () => {
    expect(createReactRouterRunConfig().tasks.test.command).toMatch(
      /vitest\.mjs run$/,
    );
  });
});
