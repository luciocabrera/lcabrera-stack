/*
 * The application the monorepo rung emits, checked against the tree it lands in.
 *
 * Nothing at run time can check these: the blueprint is inert data, and the one
 * place it is exercised — an install in a directory with no link to this
 * repository — is not where the tree that would fail is written. So the two
 * failures that reach a consumer silently are asserted here. A `workspace:`
 * specifier resolves a sibling directory, which no bootstrapped repository has,
 * and a caret on a package below 1.0.0 stops at the next minor, so a release
 * lands outside the range with every gate still green.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import { describe, expect, test } from 'vite-plus/test';

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const ASSETS = join(PACKAGE_ROOT, 'assets');

const BLUEPRINT = join(ASSETS, 'workspace');

const APP_DIRECTORY = 'apps/web';

const STACK_SCOPE = '@lcabrera/';

const WORKSPACE_SPECIFIER = 'workspace:';

const read = (...segments) => readFileSync(join(...segments), 'utf8');

const filesUnder = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });

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
    const routes = read(
      BLUEPRINT,
      ...APP_DIRECTORY.split('/'),
      'src/routes.ts',
    );
    const referenced = routes
      .matchAll(/'(routes\/[^']+)'/g)
      .map((match) => match[1])
      .toArray();
    expect(referenced.length).toBeGreaterThan(0);
    for (const route of referenced) {
      expect(() =>
        read(
          BLUEPRINT,
          ...APP_DIRECTORY.split('/'),
          'src',
          ...route.split('/'),
        ),
      ).not.toThrow();
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

describe('nothing the kit ships resolves through this repository', () => {
  test('no shipped file carries a workspace specifier', () => {
    const carriers = filesUnder(ASSETS)
      .filter((path) => read(path).includes(WORKSPACE_SPECIFIER))
      .map((path) =>
        path
          .slice(ASSETS.length + 1)
          .split(sep)
          .join('/'),
      );
    expect(carriers).toEqual([]);
  });
});
