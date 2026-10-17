/*
 * That the author an annotation or grade is recorded under comes from the
 * repository the command runs in, not from one an inherited GIT_DIR names.
 * The spawned check runs in one scratch repository while GIT_DIR points at
 * another with a different user.email, with HOME emptied so no global config
 * answers for either.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, test } from 'vite-plus/test';

import { gitEnv } from './evals-cli.mjs';

const LIB = fileURLToPath(new URL('evals-cli.mjs', import.meta.url));
const SCRATCH_ROOT = fileURLToPath(
  new URL('../../../../.tmp/', import.meta.url),
);

mkdirSync(SCRATCH_ROOT, { recursive: true });

const scratch = mkdtempSync(join(SCRATCH_ROOT, 'evals-cli-'));

const repository = (name, email) => {
  const directory = join(scratch, name);
  mkdirSync(directory);
  execFileSync('/usr/bin/git', ['init', '-q', directory], { env: gitEnv({}) });
  execFileSync(
    '/usr/bin/git',
    ['-C', directory, 'config', 'user.email', email],
    {
      env: gitEnv({}),
    },
  );
  return directory;
};

afterAll(() => rmSync(scratch, { force: true, recursive: true }));

describe('gitEnv', () => {
  test('drops every GIT_ variable and pins PATH, keeping the rest', () => {
    expect(
      gitEnv({
        GIT_DIR: '/elsewhere/.git',
        GIT_WORK_TREE: '/elsewhere',
        HOME: '/home/someone',
        PATH: '/tmp/writable:/usr/bin',
      }),
    ).toEqual({ HOME: '/home/someone', PATH: '/usr/local/bin:/usr/bin:/bin' });
  });
});

describe('currentAuthor', () => {
  test('reads the email of the repository it runs in, not the one GIT_DIR names', () => {
    const here = repository('here', 'right@example.com');
    const elsewhere = repository('elsewhere', 'wrong@example.com');
    const { status, stdout } = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { currentAuthor } from ${JSON.stringify(LIB)}; console.log(currentAuthor());`,
      ],
      {
        cwd: here,
        encoding: 'utf8',
        env: {
          GIT_DIR: join(elsewhere, '.git'),
          HOME: scratch,
          PATH: process.env.PATH,
        },
      },
    );

    expect(status).toBe(0);
    expect(stdout.trim()).toBe('right');
  });
});
