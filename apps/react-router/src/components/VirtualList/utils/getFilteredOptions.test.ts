import { describe, expect, it } from 'vitest';

import { getFilteredOptions } from './getFilteredOptions.util.ts';

describe('getFilteredOptions', () => {
  const options = ['Apple', 'Banana', 'Cherry', 'Apricot'];

  describe('search filtering', () => {
    it('returns all options when searchTerm is empty', () => {
      expect(
        getFilteredOptions({
          listFilterMode: 'all',
          options,
          searchTerm: '',
          selectedValues: [],
        }),
      ).toEqual(options);
    });

    it('filters by searchTerm case-insensitively', () => {
      expect(
        getFilteredOptions({
          listFilterMode: 'all',
          options,
          searchTerm: 'ap',
          selectedValues: [],
        }),
      ).toEqual(['Apple', 'Apricot']);
    });

    it('returns empty array when no options match', () => {
      expect(
        getFilteredOptions({
          listFilterMode: 'all',
          options,
          searchTerm: 'zzz',
          selectedValues: [],
        }),
      ).toEqual([]);
    });
  });

  describe('listFilterMode', () => {
    const selected = ['Apple', 'Cherry'];

    it('returns all options in "all" mode', () => {
      expect(
        getFilteredOptions({
          listFilterMode: 'all',
          options,
          searchTerm: '',
          selectedValues: selected,
        }),
      ).toEqual(options);
    });

    it('returns only selected options in "selected" mode', () => {
      expect(
        getFilteredOptions({
          listFilterMode: 'selected',
          options,
          searchTerm: '',
          selectedValues: selected,
        }),
      ).toEqual(['Apple', 'Cherry']);
    });

    it('returns only unselected options in "unselected" mode', () => {
      expect(
        getFilteredOptions({
          listFilterMode: 'unselected',
          options,
          searchTerm: '',
          selectedValues: selected,
        }),
      ).toEqual(['Banana', 'Apricot']);
    });
  });

  describe('combined search + mode', () => {
    it('applies search then mode filter', () => {
      expect(
        getFilteredOptions({
          listFilterMode: 'unselected',
          options,
          searchTerm: 'a',
          selectedValues: ['Apple'],
        }),
      ).toEqual(['Banana', 'Apricot']);
    });
  });
});
