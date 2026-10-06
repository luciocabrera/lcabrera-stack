import { describe, expect, it } from 'vite-plus/test';

import { sortedKeysReplacer } from './sortedKeysReplacer.util.ts';

describe('sortedKeysReplacer', () => {
  it('returns a plain object with its keys in code-unit order', () => {
    const replaced = sortedKeysReplacer('', JSON.parse('{"b":1,"B":2,"a":3}'));

    expect(Object.keys(new Object(replaced))).toEqual(['B', 'a', 'b']);
  });

  it('returns anything else unchanged', () => {
    const list = [2, 1];

    expect(sortedKeysReplacer('', list)).toBe(list);
    expect(sortedKeysReplacer('', 'text')).toBe('text');
  });
});
