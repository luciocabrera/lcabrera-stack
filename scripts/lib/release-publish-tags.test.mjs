/*
 * The publish job compares the tags `changeset publish` says it attempted with
 * the tags git actually gained (#745), and the first half of that comparison is
 * a parse of the CLI's output, which a major version can change without notice.
 * This runs the installed CLI against a scratch git workspace, then evaluates
 * the `reported` line exactly as `release.yml` states it.
 */
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const RELEASE_WORKFLOW = join(REPO_ROOT, '.github', 'workflows', 'release.yml');

const CHANGESET_BIN = join(
  REPO_ROOT,
  'node_modules',
  '@changesets',
  'cli',
  'bin.js',
);

const IDENTITY = {
  GIT_AUTHOR_EMAIL: 'release@example.invalid',
  GIT_AUTHOR_NAME: 'release',
  GIT_COMMITTER_EMAIL: 'release@example.invalid',
  GIT_COMMITTER_NAME: 'release',
};

const ISOLATED_GIT = {
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
};

const scratches = [];

const workflowLine = (pattern) => {
  const line = readFileSync(RELEASE_WORKFLOW, 'utf8')
    .split('\n')
    .map((text) => text.trim())
    .find((text) => pattern.test(text));
  if (line === undefined) {
    throw new Error(`release.yml has no line matching ${pattern}`);
  }
  return line;
};

const eventsPath = () =>
  /CHANGESETS_OUTPUT=(\S+)/.exec(
    workflowLine(/CHANGESETS_OUTPUT=\S+ pnpm exec changeset publish/),
  )[1];

const reportedLine = () => workflowLine(/^reported=/);

const write = (root, path, value) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), `${JSON.stringify(value, undefined, 2)}\n`);
};

const git = (root, args, env = {}) =>
  spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...ISOLATED_GIT, ...env },
  });

const workspace = () => {
  const root = mkdtempSync(join(tmpdir(), 'release-publish-tags-'));
  scratches.push(root);
  symlinkSync(join(REPO_ROOT, 'node_modules'), join(root, 'node_modules'));
  writeFileSync(join(root, '.gitignore'), 'node_modules\nevents.ndjson\n');
  writeFileSync(
    join(root, 'pnpm-workspace.yaml'),
    'packages:\n  - packages/*\n',
  );
  writeFileSync(join(root, 'pnpm-lock.yaml'), '');
  write(root, 'package.json', { name: 'scratch', private: true });
  write(root, '.changeset/config.json', {
    access: 'public',
    baseBranch: 'main',
    changelog: false,
    commit: false,
    format: false,
    privatePackages: { tag: true, version: true },
  });
  write(root, 'packages/a/package.json', {
    name: '@scratch/a',
    private: true,
    version: '1.0.0',
  });
  write(root, 'packages/b/package.json', {
    name: '@scratch/b',
    private: true,
    version: '2.0.0',
  });
  git(root, ['init', '--quiet']);
  git(root, ['config', 'user.useConfigOnly', 'true']);
  git(root, ['add', '--all']);
  git(root, ['commit', '--quiet', '--message', 'init'], IDENTITY);
  return root;
};

const tags = (root) =>
  git(root, ['tag'])
    .stdout.split('\n')
    .filter((tag) => tag.length > 0);

const publish = (root, env) => {
  const events = join(root, 'events.ndjson');
  writeFileSync(events, '');
  const before = tags(root).length;
  const run = spawnSync(process.execPath, [CHANGESET_BIN, 'publish'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...ISOLATED_GIT, ...env, CHANGESETS_OUTPUT: events },
  });
  const reported = spawnSync(
    'bash',
    [
      '-c',
      `${reportedLine().replaceAll(eventsPath(), events)}; echo "$reported"`,
    ],
    { encoding: 'utf8' },
  );
  return {
    created: tags(root).length - before,
    reported: Number(reported.stdout.trim()),
    status: run.status,
    stderr: run.stderr,
  };
};

afterEach(() => {
  for (const root of scratches.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('the publish job counts the tags changeset attempted', () => {
  it('reports every tag it created', () => {
    const run = publish(workspace(), IDENTITY);

    expect(run.status, run.stderr).toBe(0);
    expect(run).toMatchObject({ created: 2, reported: 2 });
  });

  it('reports none when nothing is left to publish', () => {
    const root = workspace();
    publish(root, IDENTITY);
    const run = publish(root, IDENTITY);

    expect(run.status, run.stderr).toBe(0);
    expect(run).toMatchObject({ created: 0, reported: 0 });
  });

  it('still reports the tags git refused, so a tagging failure stays visible', () => {
    const run = publish(workspace(), {});

    expect(run.status, run.stderr).toBe(0);
    expect(run).toMatchObject({ created: 0, reported: 2 });
  });
});
