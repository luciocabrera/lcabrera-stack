import { describe, expect, it } from 'vite-plus/test';

import { resolveNewGroupingMode } from './resolveNewGroupingMode.util';

describe('resolveNewGroupingMode', () => {
  it('takes the preference when this change creates the grouping', () => {
    expect(
      resolveNewGroupingMode({
        keys: ['region'],
        preferredMode: 'rollup',
        previousKeys: [],
        previousMode: 'flat',
      }),
    ).toBe('rollup');
  });

  it('leaves an existing grouping on the mode it is already in', () => {
    expect(
      resolveNewGroupingMode({
        keys: ['region', 'status'],
        preferredMode: 'rollup',
        previousKeys: ['region'],
        previousMode: 'flat',
      }),
    ).toBe('flat');
  });

  it('does not reinstate itself when the user switched the mode back', () => {
    // The reader prefers rollup and has switched this table to flat. Adding a
    // second key must not undo that, which is the failure a loader-side default
    // would produce.
    expect(
      resolveNewGroupingMode({
        keys: ['region', 'status'],
        preferredMode: 'rollup',
        previousKeys: ['region'],
        previousMode: 'flat',
      }),
    ).toBe('flat');
  });

  it('leaves a removal alone, including the one that empties the keys', () => {
    expect(
      resolveNewGroupingMode({
        keys: [],
        preferredMode: 'rollup',
        previousKeys: ['region'],
        previousMode: 'rollup',
      }),
    ).toBe('rollup');
  });

  it('keeps the previous mode when no preference is set', () => {
    expect(
      resolveNewGroupingMode({
        keys: ['region'],
        previousKeys: [],
        previousMode: 'flat',
      }),
    ).toBe('flat');
  });

  it('applies again once the grouping is cleared and started over', () => {
    expect(
      resolveNewGroupingMode({
        keys: ['status'],
        preferredMode: 'rollup',
        previousKeys: [],
        previousMode: 'flat',
      }),
    ).toBe('rollup');
  });
});
