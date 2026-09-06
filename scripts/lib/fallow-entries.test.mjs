import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  isConfigFragmentPattern,
  isExactPath,
  isTestFilePattern,
  manifestInvokes,
  readFallowEntries,
  scriptInvocationsIn,
} from './fallow-entries.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const readRepoFile = (path) => readFileSync(join(REPO_ROOT, path), 'utf8');

const readManifest = (dir) =>
  JSON.parse(readRepoFile(join(dir, 'package.json')));

const filesIn = (dir, matches) =>
  readdirSync(join(REPO_ROOT, dir))
    .filter(matches)
    .map((name) => join(dir, name));

const INVOKER_FILES = [
  ...filesIn('.github/workflows', (name) => name.endsWith('.yml')),
  '.claude/settings.json',
  ...filesIn('scripts', (name) => name.endsWith('.sh')),
];

const WORKSPACE_DIRS = ['apps', 'packages'].flatMap((parent) =>
  readdirSync(join(REPO_ROOT, parent), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(parent, entry.name)),
);

const entries = readFallowEntries(readRepoFile('.fallowrc.json'));
const rootManifest = readManifest('.');

const invocationsOutsideManifests = [
  ...new Set(
    INVOKER_FILES.flatMap((file) => scriptInvocationsIn(readRepoFile(file))),
  ),
];

const workspacesInvoking = (path) =>
  WORKSPACE_DIRS.filter(
    (dir) =>
      existsSync(join(REPO_ROOT, dir, path)) &&
      manifestInvokes(readManifest(dir), path),
  );

describe('fallow entries — the roster is derived from what the repository invokes', () => {
  it('finds the invocations fallow cannot see on its own', () => {
    expect(invocationsOutsideManifests.length).toBeGreaterThan(0);
  });

  it.each(invocationsOutsideManifests)(
    '%s is an entry point fallow resolves',
    (path) => {
      const invokedFromRoot = existsSync(join(REPO_ROOT, path));
      const covered = invokedFromRoot
        ? manifestInvokes(rootManifest, path) || entries.includes(path)
        : workspacesInvoking(path).length > 0;

      expect(covered).toBe(true);
    },
  );
});

describe('fallow entries — every hand-listed entry earns its line', () => {
  const exactEntries = entries.filter(isExactPath);
  const globEntries = entries.filter((entry) => !isExactPath(entry));

  it.each(exactEntries)('%s exists', (entry) => {
    expect(existsSync(join(REPO_ROOT, entry))).toBe(true);
  });

  it.each(exactEntries.filter((entry) => entry.startsWith('scripts/')))(
    '%s is invoked outside a package.json, where fallow would already see it',
    (entry) => {
      expect(invocationsOutsideManifests).toContain(entry);
      expect(manifestInvokes(rootManifest, entry)).toBe(false);
    },
  );

  it.each(globEntries)(
    '%s names test files or config fragments, never a source tree',
    (entry) => {
      expect(isTestFilePattern(entry) || isConfigFragmentPattern(entry)).toBe(
        true,
      );
    },
  );
});

describe('scriptInvocationsIn', () => {
  it('reads a root-relative script whether bare, quoted or behind a shell variable', () => {
    const text = [
      'run: node scripts/one.mjs --flag',
      '"command": "node \\"$CLAUDE_PROJECT_DIR/scripts/two.mjs\\""',
      'bash scripts/changed-files.sh node scripts/lib/three.cjs',
    ].join('\n');

    expect(scriptInvocationsIn(text)).toEqual([
      'scripts/one.mjs',
      'scripts/two.mjs',
      'scripts/lib/three.cjs',
    ]);
  });

  it('ignores a mention that is not a node invocation', () => {
    const text = [
      '# the map lives in scripts/lib/project-status.mjs:',
      '      - scripts/lib/labels.mjs',
      'bash scripts/publish-bootstrap.sh',
      'node .github/skills/demo/scripts/run.mjs',
    ].join('\n');

    expect(scriptInvocationsIn(text)).toEqual([]);
  });
});
