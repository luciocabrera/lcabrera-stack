/*
 * What `devkit create` tells a new repository to do next, and what an
 * `init --upgrade` straight after it no longer asks for.
 *
 * Both claims are about a real repository and a real git config, so these run
 * `create` into a scratch directory rather than against a stub.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runInit } from './command-init.mjs';
import {
  createUnderWith,
  git,
  quietlyWith,
  scratchDirectories,
} from './create-fixtures.mjs';

const scratches = scratchDirectories('devkit-next-steps-');

const scratch = scratches.make;

const quietly = (run) => quietlyWith(vi, run);

const createUnder = (args) => createUnderWith(vi, args);

afterEach(scratches.drain);

describe('what a created repository is told to do next', () => {
  test('names the directory, the install and the dev task, in the commands it configured', () => {
    const parent = scratch();
    const { code, printed } = createUnder({ parent, profile: 'monorepo' });
    const { commands } = JSON.parse(
      readFileSync(join(parent, 'demo', 'devkit.config.json'), 'utf8'),
    );

    expect(code).toBe(0);
    expect(printed).toContain('  cd demo');
    expect(printed).toContain(`  ${commands.install}`);
    expect(printed).toContain(`  ${commands.run} dev`);
    expect(printed).toContain(`\`${commands.run} devkit:sync\``);
  });

  test('a rung with no app names no dev task', () => {
    const parent = scratch();
    const { printed } = createUnder({ parent, profile: 'agent' });

    expect(printed).toContain('  cd demo');
    expect(printed).not.toMatch(/ dev$/m);
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
