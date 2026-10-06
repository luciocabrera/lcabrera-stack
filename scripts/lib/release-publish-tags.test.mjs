/*
 * The publish job compares the tags `changeset publish` says it attempted with
 * the tags git actually gained (#745), and the first half of that comparison is
 * a parse of the CLI's output, which a major version can change without notice.
 * This runs `release.yml`'s own publish and `reported` lines in a scratch git
 * workspace, with a stub `pnpm` on PATH that runs the installed CLI, reports
 * every package unpublished and accepts every publish, so nothing leaves the
 * machine.
 */
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
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

const publishScript = (outDir) =>
  [
    'set -o pipefail',
    workflowLine(/^: > \S+$/),
    'published_status=0',
    workflowLine(/^CHANGESETS_OUTPUT=\S+ pnpm exec changeset publish/),
    workflowLine(/^reported=/),
    String.raw`printf '\nRESULT %s %s\n' "$published_status" "$reported"`,
  ]
    .join('\n')
    .replaceAll('/tmp/', `${outDir}/`);

const stubPnpm = (binDir) => {
  mkdirSync(binDir, { recursive: true });
  const stub = join(binDir, 'pnpm');
  writeFileSync(
    stub,
    [
      '#!/usr/bin/env bash',
      'case "$1" in',
      '  --version) echo 12.9.1 ;;',
      `  exec) shift; [ "$1" = changeset ] && shift; exec '${process.execPath}' '${CHANGESET_BIN}' "$@" ;;`,
      `  info) echo '{"error":{"code":"ERR_PNPM_FETCH_404","message":"Not Found"}}'; exit 1 ;;`,
      "  publish) echo '{}' ;;",
      '  *) echo "stub pnpm: unexpected $*" >&2; exit 2 ;;',
      'esac',
      '',
    ].join('\n'),
  );
  chmodSync(stub, 0o755);
};

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

const workspace = ({ isPrivate }) => {
  const root = mkdtempSync(join(tmpdir(), 'release-publish-tags-'));
  scratches.push(root);
  symlinkSync(join(REPO_ROOT, 'node_modules'), join(root, 'node_modules'));
  stubPnpm(join(root, '.stub'));
  mkdirSync(join(root, '.out'));
  writeFileSync(join(root, '.gitignore'), 'node_modules\n.stub\n.out\n');
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
    private: isPrivate,
    version: '1.0.0',
  });
  write(root, 'packages/b/package.json', {
    name: '@scratch/b',
    private: isPrivate,
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
  const before = tags(root).length;
  const { CHANGESETS_OUTPUT: _ignored, ...inherited } = process.env;
  const run = spawnSync('bash', ['-c', publishScript(join(root, '.out'))], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...inherited,
      ...ISOLATED_GIT,
      ...env,
      PATH: `${join(root, '.stub')}:${process.env.PATH}`,
    },
  });
  const [, status, reported] = /^RESULT (\d+) (\d+)$/m.exec(run.stdout) ?? [];
  return {
    created: tags(root).length - before,
    output: `${run.stdout}${run.stderr}`,
    reported: Number(reported),
    status: Number(status),
  };
};

afterEach(() => {
  for (const root of scratches.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('the publish job counts the tags changeset attempted', () => {
  it('reports a tag for every package it published to the registry', () => {
    const run = publish(workspace({ isPrivate: false }), IDENTITY);

    expect(run.status, run.output).toBe(0);
    expect(run.output).toContain('Successfully published');
    expect(run).toMatchObject({ created: 2, reported: 2 });
  });

  it('reports every tag-only release it tagged', () => {
    const run = publish(workspace({ isPrivate: true }), IDENTITY);

    expect(run.status, run.output).toBe(0);
    expect(run).toMatchObject({ created: 2, reported: 2 });
  });

  it('reports none when nothing is left to publish', () => {
    const root = workspace({ isPrivate: true });
    publish(root, IDENTITY);
    const run = publish(root, IDENTITY);

    expect(run.status, run.output).toBe(0);
    expect(run).toMatchObject({ created: 0, reported: 0 });
  });

  it('still reports the tags git refused, so a tagging failure stays visible', () => {
    const run = publish(workspace({ isPrivate: false }), {});

    expect(run.status, run.output).toBe(0);
    expect(run).toMatchObject({ created: 0, reported: 2 });
  });
});
