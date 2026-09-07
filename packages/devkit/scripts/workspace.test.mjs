/*
 * The two halves of the monorepo rung that are written in different files and
 * have to agree: the manifest fields, which `create` writes, and the blueprint,
 * which `sync` materialises.
 *
 * Neither half can check the other at run time — the manifest is written before
 * anything is installed, and the blueprint is inert data — so a pin that moved
 * on one side would reach a consumer as a tree that installs and then refuses
 * its own engine, or a task filtering for a workspace that is not there.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, matchesGlob, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vite-plus/test';

import { configs } from '../assets/workspace/packages/typescript-config/tsconfig.entries.ts';
import { initialManifest } from './create.mjs';
import {
  GENERATED_TSCONFIGS,
  NODE_VERSION,
  TSCONFIG_WORKSPACE,
  WORKSPACE_DEPENDENCIES,
  WORKSPACE_SCRIPTS,
  nodeEngineBand,
  withWorkspaceFields,
} from './workspace.mjs';

const BLUEPRINT = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  'assets',
  'workspace',
);

const read = (...segments) =>
  readFileSync(join(BLUEPRINT, ...segments), 'utf8');

const CATALOGS_KEY = 'catalogs:';

const GROUP_HEADER = /^ {2}([\w-]+):[ \t]*$/;

const GROUP_ENTRY = /^ {4}'?([^':]+)'?:/;

const catalogGroups = (workspaceFile) => {
  const lines = workspaceFile.split('\n');
  const start = lines.indexOf(CATALOGS_KEY);
  const groups = new Map();
  if (start === -1) return groups;

  let current;
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    const header = GROUP_HEADER.exec(line);
    if (header) {
      current = header[1];
      groups.set(current, []);
      continue;
    }
    const entry = GROUP_ENTRY.exec(line);
    if (entry === null || current === undefined) break;
    groups.get(current).push(entry[1]);
  }
  return groups;
};

describe('nodeEngineBand', () => {
  test('admits the whole major the pin sits in, and nothing above it', () => {
    expect(nodeEngineBand('26.8.1')).toBe('>=26 <27');
    expect(nodeEngineBand('7.0.0')).toBe('>=7 <8');
  });

  test('is wider than the pin, so a patch release is not a hard failure', () => {
    expect(nodeEngineBand(NODE_VERSION)).not.toBe(NODE_VERSION);
  });

  test('refuses a version it cannot read a major out of', () => {
    expect(() => nodeEngineBand('latest')).toThrow(/major version/);
  });
});

describe('the pin and the band arrive together', () => {
  test('the band is derived from the version the blueprint pins', () => {
    expect(read('.node-version').trim()).toBe(NODE_VERSION);
  });

  test('the tree the rung emits declares the band it derived', () => {
    expect(withWorkspaceFields().engines.node).toBe(
      nodeEngineBand(NODE_VERSION),
    );
  });
});

describe('the tasks name what the blueprint holds', () => {
  test('the generator task filters for the workspace that is shipped', () => {
    const manifest = JSON.parse(
      read('packages', 'typescript-config', 'package.json'),
    );
    expect(manifest.name).toBe(TSCONFIG_WORKSPACE);
    expect(WORKSPACE_SCRIPTS['tsconfig:generate']).toContain(
      TSCONFIG_WORKSPACE,
    );
  });

  test('every dependency the rung adds resolves through the catalog', () => {
    const catalogued = Object.values(WORKSPACE_DEPENDENCIES).filter(
      (specifier) => !specifier.startsWith('catalog:'),
    );
    expect(catalogued).toEqual([]);
  });

  test('the catalog a dependency names holds that dependency', () => {
    const groups = catalogGroups(read('pnpm-workspace.yaml'));
    expect([...groups.keys()].length).toBeGreaterThan(0);
    for (const [name, specifier] of Object.entries(WORKSPACE_DEPENDENCIES)) {
      expect(groups.get(specifier.slice('catalog:'.length))).toContain(name);
    }
  });

  test('the generator task formats what it wrote, never the whole tree', () => {
    const task = WORKSPACE_SCRIPTS['tsconfig:generate'];
    expect(task).toContain(`vp fmt '${GENERATED_TSCONFIGS}'`);
    expect(task).not.toMatch(/vp fmt[ \t]+\.(?:[ \t]|$)/);
  });

  test('the glob reaches every config the roster writes, at every depth', () => {
    const written = configs.map((entry) =>
      relative(BLUEPRINT, entry.filePath).split(sep).join('/'),
    );
    expect(written.length).toBeGreaterThan(1);
    expect(new Set(written.map((path) => path.split('/').length)).size).toBe(2);
    for (const path of written) {
      expect(matchesGlob(path, GENERATED_TSCONFIGS)).toBe(true);
    }
  });

  test('and reaches nothing the roster did not write', () => {
    for (const path of [
      'packages/typescript-config/tsconfig.entries.ts',
      'vite.config.ts',
      'package.json',
    ]) {
      expect(matchesGlob(path, GENERATED_TSCONFIGS)).toBe(false);
    }
  });

  test('the blueprint workspace resolves through the catalog too', () => {
    const groups = catalogGroups(read('pnpm-workspace.yaml'));
    const manifest = JSON.parse(
      read('packages', 'typescript-config', 'package.json'),
    );
    const declared = Object.entries(manifest.devDependencies ?? {});
    expect(declared.length).toBeGreaterThan(0);
    for (const [name, specifier] of declared) {
      expect(specifier.startsWith('catalog:')).toBe(true);
      expect(groups.get(specifier.slice('catalog:'.length))).toContain(name);
    }
  });
});

describe('withWorkspaceFields', () => {
  test('adds the task block, the band and the package manager pin', () => {
    const manifest = withWorkspaceFields();
    expect(manifest.scripts).toEqual(WORKSPACE_SCRIPTS);
    expect(manifest.devDependencies).toEqual(WORKSPACE_DEPENDENCIES);
    expect(manifest.packageManager).toMatch(/^pnpm@\d/);
  });

  test('a field the caller set wins, so an existing repository is not broken', () => {
    const manifest = withWorkspaceFields({
      manifest: {
        engines: { node: '>=24' },
        packageManager: 'yarn@4.0.0',
        scripts: { 'test:all': 'my own runner' },
      },
    });
    expect(manifest.scripts['test:all']).toBe('my own runner');
    expect(manifest.engines.node).toBe('>=24');
    expect(manifest.packageManager).toBe('yarn@4.0.0');
  });
});

describe('initialManifest', () => {
  test('a rung below monorepo gets a manifest with nothing wired', () => {
    for (const profile of ['agent', 'repo']) {
      const manifest = initialManifest({ name: 'demo', profile });
      expect(manifest.scripts).toBeUndefined();
      expect(manifest.devDependencies).toBeUndefined();
      expect(manifest.engines).toBeUndefined();
    }
  });

  test('the monorepo rung and above get the workspace fields', () => {
    for (const profile of ['monorepo', 'full']) {
      const manifest = initialManifest({ name: 'demo', profile });
      expect(manifest.name).toBe('demo');
      expect(manifest.private).toBe(true);
      expect(manifest.scripts).toEqual(WORKSPACE_SCRIPTS);
      expect(manifest.engines.node).toBe(nodeEngineBand(NODE_VERSION));
    }
  });

  test('a profile nobody passed places nothing, rather than everything', () => {
    expect(initialManifest({ name: 'demo' }).scripts).toBeUndefined();
  });
});
