import { spawnSync } from 'node:child_process';
import {
  closeSync,
  mkdtempSync,
  openSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vite-plus/test';

import {
  COULD_NOT_RUN,
  processEffects,
  runFallowGateCommand,
} from './fallow-gate-command.mjs';

const BIN = fileURLToPath(new URL('run-fallow-gate.mjs', import.meta.url));

const processWith = (overrides) =>
  new Proxy(process, {
    get: (target, key) => {
      if (Object.hasOwn(overrides, key)) return overrides[key];
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set: (_target, key, value) => {
      overrides[key] = value;
      return true;
    },
  });

describe('repo-fallow-gate', () => {
  it('runs the command on its own process and keeps the exit code', async () => {
    const written = [];
    const overrides = {
      argv: ['node', BIN, 'dupes'],
      env: {},
      exitCode: undefined,
      stderr: {
        write: (text) => {
          written.push(text);
        },
      },
    };
    vi.stubGlobal('process', processWith(overrides));
    try {
      await import('./run-fallow-gate.mjs');
    } finally {
      vi.unstubAllGlobals();
    }
    expect(overrides.exitCode).toBe(2);
    expect(written.join('')).toContain(
      'usage: repo-fallow-gate <architecture|',
    );
  });

  it('exits with that code when node runs it', () => {
    const child = spawnSync(process.execPath, [BIN, 'dupes'], {
      encoding: 'utf8',
    });
    expect(child.status).toBe(2);
    expect(child.stderr).toContain('usage: repo-fallow-gate <architecture|');
  });
});

const fakeProcess = ({ argv, env = {} }) => {
  const out = [];
  const err = [];
  return {
    argv: ['node', 'repo-fallow-gate', ...argv],
    env,
    err,
    out,
    stderr: {
      write: (text) => {
        err.push(text);
      },
    },
    stdin: { isTTY: true },
    stdout: {
      write: (text) => {
        out.push(text);
      },
    },
  };
};

describe('runFallowGateCommand', () => {
  it('reads the analysis after the interpreter and the script', () => {
    const proc = fakeProcess({ argv: ['guard', '--', 'missing-file.ts'] });
    expect(runFallowGateCommand(proc)).toBe(0);
    expect(proc.out.join('')).toBe(
      'fallow guard: no changed source file, so there is nothing to check.\n',
    );
  });

  it('refuses to run when no file is named and stdin is a terminal', () => {
    const proc = fakeProcess({ argv: ['architecture'] });
    expect(runFallowGateCommand(proc)).toBe(COULD_NOT_RUN);
    expect(proc.err.join('')).toContain(
      'no files were named and stdin is a terminal',
    );
  });

  it('reads the changed files from stdin when it is not a terminal', () => {
    const directory = mkdtempSync(join(tmpdir(), 'fallow-gate-stdin-'));
    const listing = join(directory, 'files.txt');
    writeFileSync(listing, '  one.ts \n\ntwo.ts\n');
    const fd = openSync(listing, 'r');
    try {
      const proc = fakeProcess({ argv: [] });
      proc.stdin = { fd, isTTY: false };
      expect(processEffects(proc).readStdinFiles()).toEqual([
        'one.ts',
        'two.ts',
      ]);
    } finally {
      closeSync(fd);
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it('reads the merge base from the environment', () => {
    const argv = ['security', '--', 'missing-file.ts'];
    const withBase = fakeProcess({ argv, env: { CHANGED_FILES_BASE: 'abc' } });
    const withoutBase = fakeProcess({ argv });
    expect(runFallowGateCommand(withBase)).toBe(0);
    expect(runFallowGateCommand(withoutBase)).toBe(COULD_NOT_RUN);
    expect(withoutBase.err.join('')).toContain('CHANGED_FILES_BASE');
  });
});
