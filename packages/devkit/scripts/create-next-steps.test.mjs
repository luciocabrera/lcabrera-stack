/*
 * What `devkit create` tells a new repository to do next, and what an
 * `init --upgrade` straight after it no longer asks for.
 *
 * Both claims are about a real repository and a real git config, so these run
 * `create` into a scratch directory rather than against a stub.
 */

import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runInit } from './command-init.mjs';
import {
  createUnderWith,
  git,
  quietlyWith,
  scratchDirectories,
} from './create-fixtures.mjs';
import { firstInstallFor, shellWord } from './create.mjs';

const scratches = scratchDirectories('devkit-next-steps-');

const scratch = scratches.make;

const quietly = (run) => quietlyWith(vi, run);

const createUnder = (args) => createUnderWith(vi, args);

afterEach(scratches.drain);

describe('what a created repository is told to do next', () => {
  test('the monorepo rung: the directory, an install, the dev task and the devkit tasks', () => {
    const parent = scratch();
    const { code, printed } = createUnder({ parent, profile: 'monorepo' });

    expect(code).toBe(0);
    expect(printed).toContain(
      'Start with:\n  cd demo\n  vp install\n  vp run dev',
    );
    expect(printed).toContain('`vp run devkit:sync`');
  });

  test.each([
    ['pnpm/12.6.0 npm/? node/v26.10.0 linux x64', 'pnpm install'],
    ['npm/11.0.0 node/v26.10.0 linux x64', 'npm install'],
  ])(
    'a rung with no app, created under %s, installs with no lockfile and names no dev task',
    (userAgent, install) => {
      vi.stubEnv('npm_config_user_agent', userAgent);
      const parent = scratch();
      const { printed } = createUnder({ parent, profile: 'agent' });
      vi.unstubAllEnvs();

      expect(printed).toContain(`Start with:\n  cd demo\n  ${install}\n`);
      expect(printed).not.toMatch(/frozen-lockfile|npm ci| dev$/m);
    },
  );

  test.each([
    ['demo', 'demo'],
    ['nested/demo', 'nested/demo'],
    ['my project', "'my project'"],
    ["it's", String.raw`'it'\''s'`],
    ['$(touch x)', "'$(touch x)'"],
  ])('cd names %s as a shell reads it', (target, word) => {
    expect(shellWord(target)).toBe(word);
  });

  test.each([
    ['vp run', 'vp install'],
    ['pnpm run', 'pnpm install'],
    ['yarn run', 'yarn install'],
    ['bun run', 'bun install'],
    ['npm run', 'npm install'],
  ])('the first install for `%s` is `%s`', (run, install) => {
    expect(firstInstallFor(run)).toBe(install);
  });
});

describe('an upgrade straight after create', () => {
  test('does not ask for the hooks create already turned on', () => {
    const parent = scratch();
    createUnder({ parent, profile: 'repo' });
    const created = join(parent, 'demo');
    const upgraded = quietly(() => runInit(['--upgrade'], created));

    expect(git(['config', '--get', 'core.hooksPath'], created)).toBe(
      '.githooks',
    );
    expect(upgraded.code).toBe(0);
    expect(upgraded.printed).not.toContain('core.hooksPath');
  });

  test('still asks when git does not run them', () => {
    const parent = scratch();
    createUnder({ parent, profile: 'repo' });
    const created = join(parent, 'demo');
    git(['config', '--unset', 'core.hooksPath'], created);
    const upgraded = quietly(() => runInit(['--upgrade'], created));

    expect(upgraded.printed).toContain('git config core.hooksPath .githooks');
  });
});
