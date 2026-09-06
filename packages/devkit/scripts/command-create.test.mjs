/*
 * What `devkit create` leaves on disk, and what it refuses to leave.
 *
 * It touches a real filesystem and a real git because the claims are about
 * both: a directory that exists, a repository with a commit in it, and a
 * refusal that created nothing. A stubbed writer would assert the stub.
 */

import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runCreate } from './command-create.mjs';
import { CREATE_BRANCH, INITIAL_COMMIT_MESSAGE } from './create.mjs';

const scratches = [];

const scratch = () => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-create-'));
  scratches.push(root);
  return root;
};

const git = (args, cwd) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

const quietly = (run) => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    return { code: run(), errors: error.mock.calls.flat().join('\n') };
  } finally {
    log.mockRestore();
    error.mockRestore();
  }
};

afterEach(() => {
  for (const root of scratches.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('devkit create, from an empty parent directory', () => {
  test('leaves a git repository holding the agent rung, with a commit', () => {
    const parent = scratch();
    const { code } = quietly(() =>
      runCreate(['demo', '--profile', 'agent'], parent),
    );
    const created = join(parent, 'demo');

    expect(code).toBe(0);
    expect(existsSync(join(created, '.git'))).toBe(true);
    expect(git(['rev-parse', '--abbrev-ref', 'HEAD'], created)).toBe(
      CREATE_BRANCH,
    );
    expect(git(['log', '-1', '--pretty=%s'], created)).toBe(
      INITIAL_COMMIT_MESSAGE,
    );
    expect(git(['status', '--porcelain'], created)).toBe('');

    const config = JSON.parse(
      readFileSync(join(created, 'devkit.config.json'), 'utf8'),
    );
    expect(config.profile).toBe('agent');
    expect(config.conventions.defaultBranch).toBe(CREATE_BRANCH);

    const manifest = JSON.parse(
      readFileSync(join(created, '.devkit-manifest.json'), 'utf8'),
    );
    expect(Object.keys(manifest.files).length).toBeGreaterThan(0);

    const tracked = git(['ls-files'], created).split('\n');
    expect(tracked).toContain('.devkit-manifest.json');
    expect(tracked).toContain('package.json');
    expect(tracked.some((path) => path.startsWith('.github/skills/'))).toBe(
      true,
    );
  });

  test('accepts a directory that is already there and empty', () => {
    const parent = scratch();
    mkdirSync(join(parent, 'empty'));

    const { code } = quietly(() => runCreate(['empty'], parent));

    expect(code).toBe(0);
    expect(git(['log', '-1', '--pretty=%s'], join(parent, 'empty'))).toBe(
      INITIAL_COMMIT_MESSAGE,
    );
  });

  test('names the package after the directory it made', () => {
    const parent = scratch();
    quietly(() => runCreate(['My App'], parent));
    expect(
      JSON.parse(readFileSync(join(parent, 'My App', 'package.json'), 'utf8'))
        .name,
    ).toBe('my-app');
  });
});

describe('what devkit create refuses', () => {
  test('a non-empty target, without writing into it', () => {
    const parent = scratch();
    mkdirSync(join(parent, 'demo'));
    writeFileSync(join(parent, 'demo', 'README.md'), '# mine\n');

    const { code, errors } = quietly(() => runCreate(['demo'], parent));

    expect(code).toBe(1);
    expect(errors).toContain('is not empty');
    expect(errors).toContain('devkit init');
    expect(readdirSync(join(parent, 'demo'))).toEqual(['README.md']);
  });

  test('a name a file already holds, rather than letting the read throw', () => {
    const parent = scratch();
    writeFileSync(join(parent, 'demo'), 'not a directory\n');

    const { code, errors } = quietly(() => runCreate(['demo'], parent));

    expect(code).toBe(1);
    expect(errors).toContain('is not a directory');
    expect(errors).not.toContain('ENOTDIR');
    expect(readFileSync(join(parent, 'demo'), 'utf8')).toBe(
      'not a directory\n',
    );
  });

  test('a directory it cannot list, rather than letting the read throw', () => {
    const parent = scratch();
    const locked = join(parent, 'locked');
    mkdirSync(locked);
    chmodSync(locked, 0o000);

    const { code, errors } = quietly(() => runCreate(['locked'], parent));
    chmodSync(locked, 0o755);

    expect(code).toBe(1);
    expect(errors).toContain('cannot be read');
    expect(errors).not.toContain('EACCES');
  });

  test('a target nested inside an existing repository, creating nothing', () => {
    const parent = scratch();
    git(['init', '--quiet', '.'], parent);

    const { code, errors } = quietly(() => runCreate(['demo'], parent));

    expect(code).toBe(1);
    expect(errors).toContain('devkit init');
    expect(existsSync(join(parent, 'demo'))).toBe(false);
  });

  test('--profile=<name>, which would otherwise run the default rung and report success', () => {
    const parent = scratch();

    const { code, errors } = quietly(() =>
      runCreate(['demo', '--profile=repo'], parent),
    );

    expect(code).toBe(1);
    expect(errors).toContain('--profile=repo');
    expect(existsSync(join(parent, 'demo'))).toBe(false);
  });

  test('an unknown profile, before it makes the directory', () => {
    const parent = scratch();

    const { code, errors } = quietly(() =>
      runCreate(['demo', '--profile', 'kitchen-sink'], parent),
    );

    expect(code).toBe(1);
    expect(errors).toContain('unknown profile');
    expect(errors).toContain('agent');
    expect(existsSync(join(parent, 'demo'))).toBe(false);
  });

  test('a --profile with no name after it', () => {
    const parent = scratch();

    const { code, errors } = quietly(() =>
      runCreate(['demo', '--profile'], parent),
    );

    expect(code).toBe(1);
    expect(errors).toContain('--profile needs a profile name');
    expect(existsSync(join(parent, 'demo'))).toBe(false);
  });

  test('no target at all', () => {
    const parent = scratch();
    const { code, errors } = quietly(() => runCreate([], parent));

    expect(code).toBe(1);
    expect(errors).toContain('devkit init');
    expect(readdirSync(parent)).toEqual([]);
  });
});

describe('a rung above repo', () => {
  test('says what it places, rather than looking like it placed more', () => {
    const parent = scratch();
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const code = runCreate(['demo', '--profile', 'monorepo'], parent);
    const printed = log.mock.calls.flat().join('\n');
    log.mockRestore();
    error.mockRestore();

    expect(code).toBe(0);
    expect(printed).toContain('"monorepo" profile places what "repo" places');
  });
});
