import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import {
  afterEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vite-plus/test';

import { createFixtureRoots } from '../../packages/repo-standards/scripts/repo-fixtures.mjs';

import { jsonWriterIn, runCommand } from './command-shell.mjs';

const roots = createFixtureRoots('command-shell-');

afterEach(() => roots.removeAll());

const keepExitCode = () => {
  const before = process.exitCode;
  onTestFinished(() => {
    process.exitCode = before;
  });
};

describe('jsonWriterIn', () => {
  it('writes indented JSON with a trailing newline, creating the directory', () => {
    const root = roots.make();
    jsonWriterIn(root)('a/b/case.json', { id: 1 });
    expect(readFileSync(join(root, 'a/b/case.json'), 'utf8')).toBe(
      '{\n  "id": 1\n}\n',
    );
    expect(() => jsonWriterIn(root)('../out.json', {})).toThrow(
      'resolves outside the repository',
    );
  });
});

describe('runCommand', () => {
  it('sets the exit code the run returns', () => {
    keepExitCode();
    runCommand({ name: 'x', run: () => 0 });
    expect(process.exitCode).toBe(0);
  });

  it('turns a thrown error into one prefixed stderr line and exit code 1', () => {
    keepExitCode();
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    onTestFinished(() => stderr.mockRestore());
    runCommand({
      name: 'adjudicate:rule',
      run: () => {
        throw new Error('no panel record');
      },
    });
    runCommand({
      name: 'adjudicate',
      run: () => {
        throw 'plain';
      },
    });
    expect(stderr.mock.calls).toEqual([
      ['adjudicate:rule: no panel record\n'],
      ['adjudicate: plain\n'],
    ]);
    expect(process.exitCode).toBe(1);
  });
});
