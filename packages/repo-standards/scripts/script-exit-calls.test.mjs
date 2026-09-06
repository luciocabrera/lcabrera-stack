/*
 * The comment-versus-call distinction is why this parses instead of grepping;
 * ADR-090 has the reasoning.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  findProcessExitCalls,
  mayContainExitCall,
} from './script-exit-calls.mjs';

describe('findProcessExitCalls', () => {
  it('finds a real call, with its line', () => {
    const source = ['const a = 1;', '', 'process.exit(1);'].join('\n');

    expect(findProcessExitCalls(source)).toEqual([
      { line: 3, text: 'process.exit(1)' },
    ]);
  });

  it('finds every call, not just the first', () => {
    const source = ['process.exit(1);', 'process.exit(2);'].join('\n');

    expect(findProcessExitCalls(source).map((call) => call.line)).toEqual([
      1, 2,
    ]);
  });

  it('ignores a call written in a line comment', () => {
    expect(findProcessExitCalls('// never process.exit(1) here')).toEqual([]);
  });

  it('ignores a call written in a block comment', () => {
    expect(findProcessExitCalls('/* process.exit(1) is banned */')).toEqual([]);
  });

  it('ignores a call written in a string', () => {
    expect(findProcessExitCalls("const s = 'process.exit(1)';")).toEqual([]);
  });

  it('does not flag process.exitCode, which is the form the rule asks for', () => {
    expect(findProcessExitCalls('process.exitCode = 1;')).toEqual([]);
  });

  it('does not flag an exit call on some other object', () => {
    expect(findProcessExitCalls('child.exit(1);')).toEqual([]);
  });
});

describe('mayContainExitCall', () => {
  it('is the cheap pre-filter, so it matches text a parse would reject', () => {
    expect(mayContainExitCall('// process.exit')).toBe(true);
    expect(mayContainExitCall('process.exitCode = 0;')).toBe(true);
    expect(mayContainExitCall('const a = 1;')).toBe(false);
  });
});
