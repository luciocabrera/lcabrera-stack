import { describe, expect, it } from 'vite-plus/test';

import { mergeObjects } from './merge-objects.util';

type Settings = {
  readonly nested?: { readonly deep: string };
  readonly size?: number;
  readonly theme?: string;
};

describe('mergeObjects', () => {
  describe('absent inputs collapse to undefined', () => {
    it('returns undefined when both sides are absent', () => {
      expect(mergeObjects<Settings>({})).toBeUndefined();
    });

    // Unlike mergeArrays, this guard is a strict `=== undefined` check, and
    // that is correct rather than an inconsistency: MergeObjectsArgs admits no
    // null, so undefined is the only absence the type can express.
    it('returns undefined only when BOTH sides are undefined', () => {
      expect(mergeObjects<Settings>({ baseValue: {} })).toStrictEqual({});
      expect(mergeObjects<Settings>({ overrideValue: {} })).toStrictEqual({});
    });
  });

  describe('an empty object is a value, not an absence', () => {
    it('returns {} rather than undefined when a side is empty', () => {
      expect(
        mergeObjects<Settings>({ baseValue: {}, overrideValue: {} }),
      ).toStrictEqual({});
    });
  });

  describe('merging', () => {
    it('lets overrideValue win on conflicting keys', () => {
      expect(
        mergeObjects<Settings>({
          baseValue: { size: 1, theme: 'light' },
          overrideValue: { theme: 'dark' },
        }),
      ).toStrictEqual({ size: 1, theme: 'dark' });
    });

    it('keeps keys present on only one side', () => {
      expect(
        mergeObjects<Settings>({
          baseValue: { theme: 'light' },
          overrideValue: { size: 2 },
        }),
      ).toStrictEqual({ size: 2, theme: 'light' });
    });

    it('treats an explicit undefined in overrideValue as an overwrite', () => {
      // Spread copies the key even when its value is undefined, so the base
      // value does not survive. This is the documented shallow-merge contract.
      expect(
        mergeObjects<Settings>({
          baseValue: { theme: 'light' },
          overrideValue: { theme: undefined },
        }),
      ).toStrictEqual({ theme: undefined });
    });

    it('is shallow — a nested object is replaced, not merged', () => {
      const overrideNested = { deep: 'override' };

      const result = mergeObjects<Settings>({
        baseValue: { nested: { deep: 'base' }, theme: 'light' },
        overrideValue: { nested: overrideNested },
      });

      expect(result?.nested).toBe(overrideNested);
      expect(result?.theme).toBe('light');
    });
  });

  describe('purity', () => {
    it('does not mutate either input and returns a new object', () => {
      const baseValue = { theme: 'light' };
      const overrideValue = { size: 2 };

      const result = mergeObjects<Settings>({ baseValue, overrideValue });

      expect(baseValue).toStrictEqual({ theme: 'light' });
      expect(overrideValue).toStrictEqual({ size: 2 });
      expect(result).not.toBe(baseValue);
      expect(result).not.toBe(overrideValue);
    });
  });
});
