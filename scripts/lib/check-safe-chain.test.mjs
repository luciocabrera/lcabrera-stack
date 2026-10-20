/**
 * Every task `check:safe` chains resolves to a package bin or to a script the
 * classification marks repo-specific — the property #1072 established, so a
 * gate cannot quietly return to the root `scripts/` directory as a loose file.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const read = (path) => readFileSync(join(REPO_ROOT, path), 'utf8');

const readBins = (directory) =>
  Object.keys(JSON.parse(read(`${directory}/package.json`)).bin ?? {});

const ROOT_SCRIPTS = JSON.parse(read('package.json')).scripts;

const BINS = new Set([
  ...readBins('packages/repo-standards'),
  ...readBins('packages/devkit'),
]);

const ROW =
  /^\| `([^`]+)`[ \t]*\|[^|]*\|[ \t]*([a-z—]+)[ \t]*\|[ \t]*\*\*([a-z-]+)\*\*/u;

const classificationRows = () => {
  const text = read('packages/devkit/CLASSIFICATION.md');
  const section = text.slice(text.indexOf('\n## Root scripts'));
  const end = section.indexOf('\n## ', 1);
  return new Map(
    section
      .slice(0, end === -1 ? undefined : end)
      .split('\n')
      .map((line) => ROW.exec(line))
      .filter((match) => match !== null)
      .map(([, task, update, verdict]) => [task, { update, verdict }]),
  );
};

const chainedTasks = (body) =>
  [...body.matchAll(/vp run ([a-z][\w:-]*)/g)].map(([, task]) => task);

const rootScriptPaths = (body) =>
  [...body.matchAll(/\bscripts\/[\w./-]+\.(?:mjs|cjs|sh)\b/g)].map(
    ([path]) => path,
  );

const words = (body) => body.split(/[ \t|&]+/u).filter((word) => word !== '');

const ROWS = classificationRows();

describe('check:safe — every chained task has a home the classification names', () => {
  const tasks = chainedTasks(ROOT_SCRIPTS['check:safe']);

  it('reads the chain and the classification', () => {
    expect(tasks.length).toBeGreaterThan(10);
    expect(ROWS.size).toBeGreaterThan(50);
    expect(BINS.size).toBeGreaterThan(20);
  });

  it.each(tasks)('%s has a row in the root-scripts tables', (task) => {
    expect(ROWS.has(task)).toBe(true);
  });

  const isRepoSpecific = (task) => ROWS.get(task)?.verdict === 'repo-specific';
  const repoSpecificTasks = tasks.filter((task) => isRepoSpecific(task));
  const sharedTasks = tasks.filter((task) => !isRepoSpecific(task));

  it.each(repoSpecificTasks)(
    '%s names only repo-specific scripts that exist',
    (task) => {
      expect(
        rootScriptPaths(ROOT_SCRIPTS[task]).filter(
          (path) => !existsSync(join(REPO_ROOT, path)),
        ),
      ).toEqual([]);
    },
  );

  it.each(sharedTasks)(
    '%s resolves to a bin or a consumer-owned line, not a loose script',
    (task) => {
      expect(
        rootScriptPaths(ROOT_SCRIPTS[task]).filter(
          (path) => !path.endsWith('.sh'),
        ),
      ).toEqual([]);
    },
  );

  it.each(sharedTasks.filter((task) => ROWS.get(task)?.update === 'package'))(
    '%s runs a package bin',
    (task) => {
      expect(words(ROOT_SCRIPTS[task]).some((word) => BINS.has(word))).toBe(
        true,
      );
    },
  );
});
