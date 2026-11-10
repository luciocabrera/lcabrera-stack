import { describe, expect, it } from 'vite-plus/test';

import { resolveListHeight } from './resolveListHeight.util';

const baseArgs = {
  hasSelectAll: true,
  itemHeight: 36,
  listMaxHeight: '18.75rem',
};

describe('resolveListHeight', () => {
  it('sizes the list to every loaded option plus the Select All row, capped by the max', () => {
    expect(resolveListHeight({ ...baseArgs, loadedCount: 5 })).toBe(
      'min(18.75rem, 216px)',
    );
  });

  it('counts no Select All row when the list has none', () => {
    expect(
      resolveListHeight({ ...baseArgs, hasSelectAll: false, loadedCount: 5 }),
    ).toBe('min(18.75rem, 180px)');
  });

  it('counts no Select All row for a single option, which never shows one', () => {
    expect(resolveListHeight({ ...baseArgs, loadedCount: 1 })).toBe(
      'min(18.75rem, 36px)',
    );
  });

  it('holds the full height while nothing has loaded yet', () => {
    expect(resolveListHeight({ ...baseArgs, loadedCount: 0 })).toBe('18.75rem');
  });

  it('adds the Select All row from two options on', () => {
    expect(resolveListHeight({ ...baseArgs, loadedCount: 2 })).toBe(
      'min(18.75rem, 108px)',
    );
  });
});
