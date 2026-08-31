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

  test('treats the bare word as a value everywhere but the command position', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(
      runCommand({ argv: ['closure', 'help'], root: '/nowhere' }),
    ).not.toBe(0);
    expect(log).not.toHaveBeenCalledWith(
      expect.stringContaining('devkit sync'),
    );

    log.mockRestore();
    error.mockRestore();
  });

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
