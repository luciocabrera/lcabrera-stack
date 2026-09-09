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
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
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
    const code = run();
    return {
      code,
      errors: error.mock.calls.flat().join('\n'),
      printed: log.mock.calls.flat().join('\n'),
    };
  } finally {
    log.mockRestore();
    error.mockRestore();
  }
};

const createUnder = ({ parent, profile }) =>
  quietly(() => runCreate(['demo', '--profile', profile], parent));

const repositoryBehindALink = ({ linkedFrom, parent }) => {
  const outer = join(parent, 'outer');
  const sub = join(outer, 'sub');
  mkdirSync(sub, { recursive: true });
  git(['init', '--quiet', '.'], outer);

  if (linkedFrom === undefined) {
    const alias = join(parent, 'alias');
    symlinkSync(sub, alias);
    return { link: alias, outer, sub };
  }

  const side = join(parent, linkedFrom);
  mkdirSync(side);
  symlinkSync(sub, join(side, 'demo'));
  return { link: side, outer, sub };
};

const createUnderGitConfig = ({ contents, parent }) => {
  const config = join(parent, 'gitconfig');
  writeFileSync(config, contents);
  const inherited = process.env.GIT_CONFIG_GLOBAL;
  process.env.GIT_CONFIG_GLOBAL = config;
  try {
    return quietly(() => runCreate(['demo', '--profile', 'agent'], parent));
  } finally {
    if (inherited === undefined) {
      delete process.env.GIT_CONFIG_GLOBAL;
    } else {
      process.env.GIT_CONFIG_GLOBAL = inherited;
    }
  }
};

afterEach(() => {
  const drained = [...scratches];
  scratches.length = 0;
  for (const root of drained) {
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

  test('follows a symlink to an empty directory outside any repository', () => {
    const parent = scratch();
    const real = join(parent, 'real');
    const side = join(parent, 'side');
    mkdirSync(real);
    mkdirSync(side);
    symlinkSync(real, join(side, 'demo'));

    const { code } = quietly(() => runCreate(['demo'], side));

    expect(code).toBe(0);
    expect(git(['log', '-1', '--pretty=%s'], real)).toBe(
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

  for (const { linkedFrom, what } of [
    {
      linkedFrom: 'side',
      what: 'a symlink whose destination is inside a repository',
    },
    { linkedFrom: undefined, what: 'a symlinked ancestor of the target' },
  ]) {
    test(`${what}, not just the path it was named by`, () => {
      const parent = scratch();
      const { link, outer, sub } = repositoryBehindALink({
        linkedFrom,
        parent,
      });

      const { code, errors } = quietly(() => runCreate(['demo'], link));

      expect(code).toBe(1);
      expect(errors).toContain(outer);
      expect(readdirSync(sub)).toEqual([]);
    });
  }

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

describe('when a git step fails', () => {
  test('the commit failing says what git said, and that the tree is still there', () => {
    const parent = scratch();
    const { code, errors } = createUnderGitConfig({
      contents:
        '[commit]\n\tgpgsign = true\n[gpg]\n\tprogram = /nonexistent/gpg\n',
      parent,
    });

    expect(code).toBe(1);
    expect(errors).toContain('`git commit` failed in `demo`');
    expect(errors).toContain('gpg failed to sign the data');
    expect(errors).toContain('the repository is real');
    expect(errors).not.toContain('user.name=');
    expect(existsSync(join(parent, 'demo', '.git'))).toBe(true);
  });

  test('the init failing says the directory is empty, not that the repository is real', () => {
    const parent = scratch();
    const { code, errors } = createUnderGitConfig({
      contents: 'this is not a git config\n',
      parent,
    });

    expect(code).toBe(1);
    expect(errors).toContain('`git init` failed in `demo`');
    expect(errors).toContain('it is not a repository');
    expect(errors).not.toContain('the repository is real');
    expect(existsSync(join(parent, 'demo', '.git'))).toBe(false);
    expect(readdirSync(join(parent, 'demo'))).toEqual([]);
  });
});

describe('a rung above repo', () => {
  test('says what it places, rather than looking like it placed more', () => {
    const parent = scratch();
    const { code, printed } = createUnder({ parent, profile: 'full' });

    expect(code).toBe(0);
    expect(printed).toContain('"full" profile places what "monorepo" places');
  });

  test('the monorepo rung places its own files and claims nothing else', () => {
    const parent = scratch();
    const { code, printed } = createUnder({ parent, profile: 'monorepo' });

    expect(code).toBe(0);
    expect(printed).not.toContain('places what');
    for (const path of [
      'pnpm-workspace.yaml',
      '.node-version',
      '.gitignore',
      'vite.config.ts',
      'biome.jsonc',
      'packages/typescript-config/tsconfig.entries.ts',
    ]) {
      expect(existsSync(join(parent, 'demo', path))).toBe(true);
    }
  });
});
