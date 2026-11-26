import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { runGit } from '../../packages/repo-standards/scripts/git-exec.mjs';

const SCRIPT = fileURLToPath(new URL('select-skills.mjs', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const selectSkills = (args) =>
  spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '' },
  });

describe('select-skills', () => {
  it('reads the labels it is given and runs nothing on an empty diff', () => {
    const { status, stdout } = selectSkills([
      '--base',
      'HEAD',
      '--labels',
      '["type: ci","evals"]',
    ]);
    expect(status).toBe(0);
    expect(stdout.trim().split('\n')).toStrictEqual([
      'scope=out',
      'skills=',
      'labelled=true',
      'run=false',
    ]);
  });

  it('treats a pull request without labels as not opted in', () => {
    expect(selectSkills(['--base', 'HEAD']).stdout).toContain('labelled=false');
  });

  it('resolves a ref name git lists', () => {
    const ref = runGit({
      args: ['for-each-ref', '--count=1', '--format=%(refname:short)'],
      cwd: REPO_ROOT,
    });
    expect(selectSkills(['--base', ref]).status).toBe(0);
  });

  it('refuses a revision that is not a ref name', () => {
    const { status, stderr } = selectSkills(['--base', 'HEAD~0']);
    expect(status).toBe(1);
    expect(stderr).toContain('HEAD~0');
  });

  it('fails on a base it cannot resolve', () => {
    const { status, stderr } = selectSkills(['--base', 'no-such-ref-1275']);
    expect(status).toBe(1);
    expect(stderr).toMatch(/^select-skills: /u);
  });
});
