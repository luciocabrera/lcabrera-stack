import { describe, expect, test, vi } from 'vite-plus/test';

import { runCommand } from './devkit.mjs';

describe('runCommand', () => {
  test('refuses an unknown command rather than doing nothing quietly', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    expect(runCommand({ argv: ['bogus'], root: '/nowhere' })).toBe(1);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  test('refuses no command at all', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    expect(runCommand({ argv: [], root: '/nowhere' })).toBe(1);
    error.mockRestore();
  });

  for (const request of ['--help', '-h', 'help']) {
    test(`answers ${request} on stdout, and succeeds`, () => {
      // It is the first command a consumer runs and the cheapest liveness check
      // a smoke test can make. Answering it on stderr with a failing code reads
      // as a broken install and aborts a caller running under `set -e`.
      const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const error = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      expect(runCommand({ argv: [request], root: '/nowhere' })).toBe(0);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('devkit sync'));
      expect(error).not.toHaveBeenCalled();

      log.mockRestore();
      error.mockRestore();
    });
  }

  for (const command of ['sync', 'doctor', 'closure']) {
    test(`answers ${command} --help instead of running ${command}`, () => {
      // Recognising help only in the command position left `sync --help`
      // building a plan and applying it: a consumer asking what the command
      // does got their tree written to, and exit 0. `root` here is a path that
      // does not exist, so anything that actually dispatched would throw rather
      // than return 0.
      const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const error = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      expect(runCommand({ argv: [command, '--help'], root: '/nowhere' })).toBe(
        0,
      );
      expect(log).toHaveBeenCalledWith(expect.stringContaining('devkit sync'));
      expect(error).not.toHaveBeenCalled();

      log.mockRestore();
      error.mockRestore();
    });
  }

  test('does not treat an inherited Object property as a command', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    expect(runCommand({ argv: ['constructor'], root: '/nowhere' })).toBe(1);
    expect(runCommand({ argv: ['toString'], root: '/nowhere' })).toBe(1);
    error.mockRestore();
  });

  test('ignores the separator a task runner forwards', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    expect(runCommand({ argv: ['--', 'closure'], root: '/nowhere' })).toBe(1);
    expect(error).toHaveBeenCalledWith(
      'closure needs at least one directory to analyse',
    );
    error.mockRestore();
  });

  test('refuses a flag-shaped argument instead of filtering it away', () => {
    // `closure --profile --shipped` is the profile flag with its value dropped.
    // It has to be caught before the `--shipped` dispatch, because that dispatch
    // reads the rest as directories and never looks at them again: `--profile`
    // would be filtered out unexamined and every profile checked — a clean pass
    // for a run that asked to narrow to one and was told which one by nobody.
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    expect(
      runCommand({
        argv: ['closure', '--profile', '--shipped'],
        root: '/nowhere',
      }),
    ).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('--profile'));
    error.mockRestore();
  });

  test('reports rather than analyses when closure is given nothing to analyse', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    expect(runCommand({ argv: ['closure'], root: '/nowhere' })).toBe(1);
    expect(error).toHaveBeenCalledWith(
      'closure needs at least one directory to analyse',
    );
    error.mockRestore();
  });
});

describe('the profile flag, on every command that takes it', () => {
  // One reader, so the three cannot drift: `closure` was hardened against the
  // valueless spelling while `sync` and `doctor` still read it as "absent",
  // which means "use the configured profile" — a narrower check reporting a
  // clean pass over a set it was asked to look at more widely.
  for (const command of ['sync', 'doctor', 'closure']) {
    test(`${command} refuses --profile with no name after it`, () => {
      const error = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      expect(
        runCommand({
          argv: [command, '--check', '--profile'],
          root: '/nowhere',
        }),
      ).toBe(1);
      expect(error).toHaveBeenCalledWith(
        expect.stringContaining('--profile needs a profile name'),
      );
      error.mockRestore();
    });
  }
});
