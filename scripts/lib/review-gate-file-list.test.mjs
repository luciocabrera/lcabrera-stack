/**
 * Whether the file list the sweep read accounts for every changed file —
 * the cap the files endpoint applies, and the counts that do not parse.
 */
import { describe, expect, it } from 'vite-plus/test';

import { completeFileList } from '../../packages/repo-standards/scripts/review-gate-reconcile.mjs';

describe('whether the changed-file list can be trusted', () => {
  it('accepts a list that accounts for every changed file', () => {
    expect(
      completeFileList({ expected: '2', filenames: ['a.mjs', 'b.mjs'] }),
    ).toEqual(['a.mjs', 'b.mjs']);
  });

  it('accepts an empty list for a pull request whose diff has gone empty', () => {
    expect(completeFileList({ expected: '0', filenames: [] })).toEqual([]);
  });

  it('rejects a list the files endpoint capped', () => {
    expect(
      completeFileList({
        expected: '3200',
        filenames: Array.from({ length: 3000 }, () => 'a.mjs'),
      }),
    ).toBeUndefined();
  });

  it('rejects a count that came back empty', () => {
    expect(
      completeFileList({ expected: '', filenames: ['a.mjs'] }),
    ).toBeUndefined();
  });

  it('rejects a count that came back null', () => {
    expect(
      completeFileList({ expected: 'null', filenames: ['a.mjs'] }),
    ).toBeUndefined();
  });

  it('reads a count that carries a trailing suffix', () => {
    expect(
      completeFileList({ expected: '2 files', filenames: ['a.mjs', 'b.mjs'] }),
    ).toEqual(['a.mjs', 'b.mjs']);
  });

  it('truncates a fractional count rather than rounding it up', () => {
    expect(
      completeFileList({
        expected: '3.5',
        filenames: ['a.mjs', 'b.mjs', 'c.mjs'],
      }),
    ).toEqual(['a.mjs', 'b.mjs', 'c.mjs']);
  });

  it('accepts a list longer than expected, which is a push mid-read', () => {
    expect(
      completeFileList({ expected: '1', filenames: ['a.mjs', 'b.mjs'] }),
    ).toEqual(['a.mjs', 'b.mjs']);
  });
});
