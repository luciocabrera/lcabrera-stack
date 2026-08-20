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
