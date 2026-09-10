/*
 * The application the monorepo rung emits, checked against the tree it lands in.
 *
 * Nothing at run time can check these: the blueprint is inert data, and the one
 * place it is exercised — an install in a directory with no link to this
 * repository — is not where the tree that would fail is written. So the
 * failures that reach a consumer silently are asserted here. A `workspace:`
 * specifier resolves a sibling directory, which no bootstrapped repository has;
 * a caret on a package below 1.0.0 stops at the next minor, so a release lands
 * outside the range with every gate still green; an unrouted submission path
 * answers a first interaction with a 404 rather than a build failure; and a
 * column capability left at its default puts a control on screen that the
 * loader behind it cannot answer.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import semver from 'semver';
import { describe, expect, test } from 'vite-plus/test';

import { readFilesUnder } from './files.mjs';

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const ASSETS = join(PACKAGE_ROOT, 'assets');

const BLUEPRINT = join(ASSETS, 'workspace');

const APP_DIRECTORY = 'apps/web';

const STACK_SCOPE = '@lcabrera/';

const WORKSPACE_SPECIFIER = 'workspace:';

const COOKIE_ACTION_MODULE = 'routes/api/persist-cookie/root.ts';

const COOKIE_ACTION_PATH = '_action/persist-cookie';

const COOKIE_ACTION_EXPORT =
  "export { action } from '@lcabrera/ui/routing/actions/persist-cookie.action';";

const read = (...segments) => readFileSync(join(...segments), 'utf8');

const appSourceRoot = () => join(BLUEPRINT, ...APP_DIRECTORY.split('/'), 'src');

const appSource = (path) => read(appSourceRoot(), ...path.split('/'));

const declaredModules = () =>
  appSource('routes.ts')
    .matchAll(/'(routes\/[^']+)'/g)
    .map((match) => match[1])
    .toArray();

const shippedRouteModules = () =>
  readFilesUnder({
    directory: join(appSourceRoot(), 'routes'),
    root: appSourceRoot(),
  })
    .map((file) => file.path)
    .filter((path) => path.endsWith('/root.ts'));

const appManifest = JSON.parse(
  read(BLUEPRINT, ...APP_DIRECTORY.split('/'), 'package.json'),
);

const appDependencies = {
  ...appManifest.dependencies,
  ...appManifest.devDependencies,
};

const stackDependencies = Object.entries(appDependencies).filter(([name]) =>
  name.startsWith(STACK_SCOPE),
);

const registryDependencies = stackDependencies.filter(
  ([, range]) => !range.startsWith('catalog:'),
);

describe('the application the rung emits', () => {
  test('declares the stack packages it renders through', () => {
    const names = registryDependencies.map(([name]) => name);
    expect(names).toContain(`${STACK_SCOPE}api`);
    expect(names).toContain(`${STACK_SCOPE}ui`);
    expect(names).toContain(`${STACK_SCOPE}utils`);
  });

  test('declares each of them as a range npm can resolve', () => {
    const unreadable = registryDependencies
      .filter(([, range]) => semver.validRange(range) === null)
      .map(([name, range]) => `${name}: ${range}`);
    expect(unreadable).toEqual([]);
  });

  test('leaves every other dependency to a catalog group', () => {
    const uncatalogued = Object.entries(appDependencies).filter(
      ([name, range]) =>
        !name.startsWith(STACK_SCOPE) && !range.startsWith('catalog:'),
    );
    expect(uncatalogued).toEqual([]);
  });

  test('names a route module the kit also ships', () => {
    const referenced = declaredModules();
    expect(referenced.length).toBeGreaterThan(0);
    for (const route of referenced) {
      expect(() => appSource(route)).not.toThrow();
    }
  });

  test('sits under a directory the workspace file globs', () => {
    const packages = read(BLUEPRINT, 'pnpm-workspace.yaml')
      .split('\n')
      .filter((line) => line.startsWith('  - '))
      .map((line) => line.slice('  - '.length).trim());
    expect(packages).toContain(`${dirname(APP_DIRECTORY)}/*`);
  });
});

const withNeighbours = () =>
  registryDependencies.map(([name, range]) => {
    const floor = semver.minVersion(range).version;
    return {
      name,
      nextMajor: semver.inc(floor, 'major'),
      nextMinor: semver.inc(floor, 'minor'),
      range,
    };
  });

describe('a shipped range survives the next release of what it names', () => {
  test('every stack range admits a minor above the floor it names', () => {
    expect(registryDependencies.length).toBeGreaterThan(0);

    const excluded = withNeighbours()
      .filter((entry) => !semver.satisfies(entry.nextMinor, entry.range))
      .map(
        (entry) => `${entry.range} excludes ${entry.name}@${entry.nextMinor}`,
      );
    expect(excluded).toEqual([]);
  });

  test('and stops below the next major, which may break the surface', () => {
    const admitted = withNeighbours()
      .filter((entry) => semver.satisfies(entry.nextMajor, entry.range))
      .map((entry) => `${entry.range} admits ${entry.name}@${entry.nextMajor}`);
    expect(admitted).toEqual([]);
  });
});

describe('the application answers every state change its table makes', () => {
  test('routes the path the library submits persisted state to', () => {
    expect(appSource('routes.ts')).toContain(
      `route('${COOKIE_ACTION_PATH}', '${COOKIE_ACTION_MODULE}')`,
    );
  });

  test('answers that path with the action the library ships', () => {
    expect(appSource(COOKIE_ACTION_MODULE).trim()).toBe(COOKIE_ACTION_EXPORT);
  });

  test('leaves no route module it ships undeclared', () => {
    const declared = new Set(declaredModules());
    const undeclared = shippedRouteModules().filter(
      (path) => !declared.has(path),
    );
    expect(undeclared).toEqual([]);
  });
});

const ORDERS_ROUTE = 'routes/orders';

const declaredColumns = async () => {
  const module = await import(
    pathToFileURL(join(appSourceRoot(), ORDERS_ROUTE, 'Orders.constants.ts'))
      .href
  );
  return module.COLUMNS;
};

describe('the table it renders offers only what its loader answers', () => {
  test('declares the columns the page shows', async () => {
    const columns = await declaredColumns();
    expect(columns.length).toBeGreaterThan(0);
  });

  test('turns sorting off on every one of them', async () => {
    const columns = await declaredColumns();
    const sortable = columns
      .filter((column) => column.isSortable !== false)
      .map((column) => column.key);
    expect(sortable).toEqual([]);
  });

  test('turns filtering off on every one of them', async () => {
    const columns = await declaredColumns();
    const filterable = columns
      .filter((column) => column.isFilterable !== false)
      .map((column) => column.key);
    expect(filterable).toEqual([]);
  });
});

describe('nothing the kit ships resolves through this repository', () => {
  test('no shipped file carries a workspace specifier', () => {
    const carriers = readFilesUnder({ directory: ASSETS, root: ASSETS })
      .filter((asset) => asset.content.includes(WORKSPACE_SPECIFIER))
      .map((asset) => asset.path);
    expect(carriers).toEqual([]);
  });
});
