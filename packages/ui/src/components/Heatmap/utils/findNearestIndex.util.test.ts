import { describe, expect, it } from 'vite-plus/test';

import { findNearestIndex } from './findNearestIndex.util';

const INDEXES = [1, 3, 7];

describe('findNearestIndex', () => {
  it.each([
    { current: 1, expected: 3, target: 2 },
    { current: 1, expected: 3, target: 3 },
    { current: 3, expected: 7, target: 4 },
    { current: 3, expected: 7, target: 20 },
    { current: 7, expected: 7, target: 8 },
  ])(
    'moves forward from $current towards $target',
    ({ current, expected, target }) => {
      expect(findNearestIndex({ current, indexes: INDEXES, target })).toBe(
        expected,
      );
    },
  );

  it.each([
    { current: 7, expected: 3, target: 6 },
    { current: 7, expected: 3, target: 3 },
    { current: 3, expected: 1, target: 2 },
    { current: 3, expected: 1, target: -20 },
    { current: 1, expected: 1, target: 0 },
  ])(
    'moves back from $current towards $target',
    ({ current, expected, target }) => {
      expect(findNearestIndex({ current, indexes: INDEXES, target })).toBe(
        expected,
      );
    },
  );

  it('looks back when the target is an unlisted current index', () => {
    expect(findNearestIndex({ current: 2, indexes: INDEXES, target: 2 })).toBe(
      1,
    );
  });

  it('stays put when the target is the current index', () => {
    expect(findNearestIndex({ current: 3, indexes: INDEXES, target: 3 })).toBe(
      3,
    );
  });
});
