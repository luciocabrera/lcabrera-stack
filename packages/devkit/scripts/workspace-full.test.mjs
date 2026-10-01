/*
 * The database lane the `full` rung adds to the tree the `monorepo` rung emits.
 *
 * Like the rest of the blueprint it is inert data here, and the failures it can
 * carry reach a consumer silently: an application manifest that drifted from
 * the one below it, a credential in a tracked file, an environment file git
 * would commit, or a database test that fails a machine with no database.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import { describe, expect, test } from 'vite-plus/test';

import { readFilesUnder } from './files.mjs';

const ASSETS = join(dirname(dirname(fileURLToPath(import.meta.url))), 'assets');

const FULL = join(ASSETS, 'full');

const APP = 'apps/web';

const SERVER_PACKAGE = '@lcabrera/server';

const readJson = (...segments) =>
  JSON.parse(readFileSync(join(...segments), 'utf8'));

const below = readJson(ASSETS, 'workspace', APP, 'package.json');

const full = readJson(FULL, APP, 'package.json');

const withoutKeys = (record, keys) =>
  Object.fromEntries(
    Object.entries(record).filter(([key]) => !keys.includes(key)),
  );

const ENV_LINE = /^([A-Z][A-Z0-9_]*)=(.*)$/;

const envTemplate = () =>
  readFileSync(join(FULL, 'docker/local/.env.example'), 'utf8')
    .split('\n')
    .map((line) => ENV_LINE.exec(line))
    .filter((match) => match !== null)
    .map(([, key, value]) => [key, value]);

const NOT_A_SECRET = new Set(['DB_HOST', 'DB_PORT']);

const PLACEHOLDER = /^replace[-_]/;

describe('the application the full rung places', () => {
  test('is the monorepo application plus the database lane, and nothing else', () => {
    expect(
      withoutKeys(full, ['dependencies', 'devDependencies', 'scripts']),
    ).toEqual(
      withoutKeys(below, ['dependencies', 'devDependencies', 'scripts']),
    );
    expect(withoutKeys(full.dependencies, [SERVER_PACKAGE])).toEqual(
      below.dependencies,
    );
    expect(withoutKeys(full.devDependencies, ['pg'])).toEqual(
      below.devDependencies,
    );
    expect(withoutKeys(full.scripts, ['seed', 'test:smoke'])).toEqual(
      below.scripts,
    );
  });

  test('declares the server package at a floor bounded below the next major', () => {
    const range = full.dependencies[SERVER_PACKAGE];
    const floor = semver.minVersion(range).version;
    expect(semver.satisfies(semver.inc(floor, 'minor'), range)).toBe(true);
    expect(semver.satisfies(semver.inc(floor, 'major'), range)).toBe(false);
  });

  test('seeds through the runner it ships, with the driver it declares', () => {
    expect(full.scripts.seed).toContain('scripts/seed-db.mjs');
    expect(
      readFileSync(join(FULL, APP, 'scripts/seed-db.mjs'), 'utf8'),
    ).toContain("from 'pg'");
  });
});

describe('the tests that need a database', () => {
  const smokeFiles = readFilesUnder({
    directory: join(FULL, APP),
    root: join(FULL, APP),
  }).filter((file) => file.path.endsWith('.smoke.test.ts'));

  test('exist, and each gates itself on SMOKE_DB', () => {
    expect(smokeFiles.length).toBeGreaterThan(0);
    for (const file of smokeFiles) {
      expect(file.content).toContain('SMOKE_DB');
      expect(file.content).toMatch(/describe\.skipIf\(!/);
    }
  });

  test('run under the one task that sets it, and only those files', () => {
    expect(full.scripts['test:smoke']).toMatch(/^SMOKE_DB=1 /);
    expect(full.scripts['test:smoke']).toMatch(/ run \.smoke\.$/);
    expect(Object.values(below.scripts).join('\n')).not.toContain('SMOKE_DB');
  });
});

describe('no credential ships', () => {
  test('the environment template holds a placeholder for every secret', () => {
    const entries = envTemplate();
    expect(entries.length).toBeGreaterThan(0);
    const filled = entries
      .filter(([key]) => !NOT_A_SECRET.has(key))
      .filter(([, value]) => !PLACEHOLDER.test(value))
      .map(([key]) => key);
    expect(filled).toEqual([]);
  });

  test('the compose file takes every credential from that file, with no default', () => {
    const compose = readFileSync(
      join(FULL, 'docker/local/docker-compose.yml'),
      'utf8',
    );
    expect(compose).toMatch(/POSTGRES_USER: \$\{DB_USER:\?/);
    expect(compose).toMatch(/POSTGRES_PASSWORD: \$\{DB_PASSWORD:\?/);
    expect(compose).not.toMatch(/:-/);
  });

  test('the tree ignores the real file and tracks the template', () => {
    const ignored = readFileSync(join(ASSETS, 'workspace', 'gitignore'), 'utf8')
      .split('\n')
      .map((line) => line.trim());
    expect(ignored).toContain('.env');
    expect(ignored).toContain('!.env.example');
  });
});
