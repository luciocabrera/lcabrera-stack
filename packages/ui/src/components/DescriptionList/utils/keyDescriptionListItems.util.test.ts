import { describe, expect, it } from 'vite-plus/test';

import { keyDescriptionListItems } from './keyDescriptionListItems.util';

describe('keyDescriptionListItems', () => {
  it('keys each item by its term and how often that term has appeared so far', () => {
    const items = [
      { term: 'Owner', value: 'A' },
      { term: 'Runs', value: 'B' },
      { term: 'Owner', value: 'C' },
    ];

    expect(keyDescriptionListItems(items)).toStrictEqual([
      { item: items[0], key: '1:Owner' },
      { item: items[1], key: '1:Runs' },
      { item: items[2], key: '2:Owner' },
    ]);
  });

  it('cannot collide with a term that looks like a generated key', () => {
    const keys = keyDescriptionListItems([
      { term: 'a', value: 1 },
      { term: 'a', value: 2 },
      { term: '2:a', value: 3 },
    ]).map(({ key }) => key);

    expect(new Set(keys).size).toBe(3);
  });
});
