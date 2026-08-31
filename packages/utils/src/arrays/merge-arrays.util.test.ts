import { describe, expect, it } from 'vite-plus/test';

import { mergeArrays } from './merge-arrays.util';

const nullish: null | readonly number[] = JSON.parse('null');

describe('mergeArrays', () => {
  describe('nullish inputs collapse to undefined', () => {
    it('returns undefined when both sides are absent', () => {
      expect(mergeArrays({})).toBeUndefined();
    });

    it('returns undefined when both sides are null', () => {
      expect(
        mergeArrays({ baseValue: nullish, overrideValue: nullish }),
      ).toBeUndefined();
    });

    it('returns undefined when one side is null and the other undefined', () => {
      expect(mergeArrays({ baseValue: nullish })).toBeUndefined();
      expect(mergeArrays({ overrideValue: nullish })).toBeUndefined();
    });
  });

  describe('an empty array is a value, not an absence', () => {
    it('returns [] rather than undefined when a side is an empty array', () => {
      expect(mergeArrays({ baseValue: [] })).toStrictEqual([]);
      expect(mergeArrays({ overrideValue: [] })).toStrictEqual([]);
      expect(mergeArrays({ baseValue: [], overrideValue: [] })).toStrictEqual(
        [],
      );
    });

    it('distinguishes an empty array from null on the same side', () => {
      expect(
        mergeArrays({ baseValue: [], overrideValue: nullish }),
      ).toStrictEqual([]);
      expect(
        mergeArrays({ baseValue: nullish, overrideValue: nullish }),
      ).toBeUndefined();
    });
  });

  describe('concatenation', () => {
    it('appends overrideValue after baseValue', () => {
      expect(
        mergeArrays({ baseValue: [1, 2], overrideValue: [3] }),
      ).toStrictEqual([1, 2, 3]);
    });

    it('keeps duplicates — it concatenates, it does not union', () => {
      expect(
        mergeArrays({ baseValue: [1, 1], overrideValue: [1] }),
      ).toStrictEqual([1, 1, 1]);
    });

    it('substitutes an empty array for the nullish side', () => {
      expect(
        mergeArrays({ baseValue: [1], overrideValue: nullish }),
      ).toStrictEqual([1]);
      expect(
        mergeArrays({ baseValue: nullish, overrideValue: [2] }),
      ).toStrictEqual([2]);
    });

    it('preserves element identity for object members (shallow concat)', () => {
      const item = { id: 'a' };
      const result = mergeArrays({ baseValue: [item] });

      expect(result?.[0]).toBe(item);
    });
  });

  describe('purity', () => {
    it('does not mutate either input and returns a new array', () => {
      const baseValue = [1, 2];
      const overrideValue = [3];

      const result = mergeArrays({ baseValue, overrideValue });

      expect(baseValue).toStrictEqual([1, 2]);
      expect(overrideValue).toStrictEqual([3]);
      expect(result).not.toBe(baseValue);
      expect(result).not.toBe(overrideValue);
    });
  });
});
