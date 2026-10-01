import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { runGit } from './git-exec.mjs';
import { HOST_ROOT_ENV } from './host-root.mjs';
import { createFixtureRoots, writeIn } from './repo-fixtures.mjs';

const CLI = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-conflict-markers.mjs',
);

const OPEN = '<'.repeat(7);
const SPLIT = '='.repeat(7);
const QUOTED_CLOSE = Array.from({ length: 7 }, () => '>').join(' ');

const fixtures = createFixtureRoots('conflict-markers-');

afterEach(fixtures.removeAll);

const makeRepo = (files) => {
  const root = fixtures.make();
  runGit({ args: ['init', '--initial-branch=main', '.'], cwd: root });
  const write = writeIn(root);
  for (const [path, text] of Object.entries(files)) write(path, text);
  const paths = Object.keys(files);
  if (paths.length > 0) runGit({ args: ['add', '--', ...paths], cwd: root });
  return root;
};

const run = (root) =>
  spawnSync(process.execPath, [CLI], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, [HOST_ROOT_ENV]: root },
  });

const CLEAN = {
  'README.md': `Summary\n${SPLIT}\n\nText.\n`,
  'src/index.js': 'export const answer = 42;\n',
};

describe('repo-verify-conflict-markers against a Git index', () => {
  it('passes a repository whose tracked files carry no marker', () => {
    const result = run(makeRepo(CLEAN));

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('2 tracked file(s) read');
  });

  it('fails on a raw marker and names its path and line', () => {
    const result = run(
      makeRepo({ ...CLEAN, 'notes.txt': `ours\n${OPEN} HEAD\ntheirs\n` }),
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`notes.txt:2: ${OPEN} HEAD`);
  });

  it('fails on a closing marker a formatter reprinted as nested block quotes', () => {
    const result = run(
      makeRepo({
        ...CLEAN,
        'docs/guide.md': `# Guide\n\nours\n\n${QUOTED_CLOSE} origin/main\n`,
      }),
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      `docs/guide.md:5: ${QUOTED_CLOSE} origin/main`,
    );
  });

  it('fails on a separator left alone between two lines of code', () => {
    const result = run(
      makeRepo({
        ...CLEAN,
        'src/merged.js': `const a = 1;\n${SPLIT}\nconst b = 2;\n`,
      }),
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`src/merged.js:2: ${SPLIT}`);
  });

  it('fails when a tracked file is missing from the working tree', () => {
    const root = makeRepo(CLEAN);
    rmSync(join(root, 'src/index.js'));

    const result = run(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('src/index.js (ENOENT)');
  });

  it('fails on an empty index rather than reporting a clean pass', () => {
    const result = run(makeRepo({}));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('listed no tracked files');
  });
});
