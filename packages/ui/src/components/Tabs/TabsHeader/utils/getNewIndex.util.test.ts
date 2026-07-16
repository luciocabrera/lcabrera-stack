import { describe, expect, it } from 'vitest';

import { getNewIndex } from './getNewIndex.util';

describe('getNewIndex', () => {
  it('returns previous index on ArrowLeft', () => {
    expect(
      getNewIndex({ activeIndex: 1, key: 'ArrowLeft', tabsLength: 3 }),
    ).toEqual({
      currentIndex: 1,
      newIndex: 0,
    });
  });

  it('returns next index on ArrowRight', () => {
    expect(
      getNewIndex({ activeIndex: 1, key: 'ArrowRight', tabsLength: 3 }),
    ).toEqual({
      currentIndex: 1,
      newIndex: 2,
    });
  });

  it('wraps from first to last on ArrowLeft', () => {
    expect(
      getNewIndex({ activeIndex: 0, key: 'ArrowLeft', tabsLength: 3 }),
    ).toEqual({
      currentIndex: 0,
      newIndex: 2,
    });
  });

  it('returns first tab on Home', () => {
    expect(getNewIndex({ activeIndex: 2, key: 'Home', tabsLength: 3 })).toEqual(
      {
        currentIndex: 2,
        newIndex: 0,
      },
    );
  });

  it('returns last tab on End', () => {
    expect(getNewIndex({ activeIndex: 0, key: 'End', tabsLength: 3 })).toEqual({
      currentIndex: 0,
      newIndex: 2,
    });
  });

  it('falls back to first tab when active index is unknown', () => {
    expect(
      getNewIndex({ activeIndex: -1, key: 'ArrowRight', tabsLength: 3 }),
    ).toEqual({
      currentIndex: 0,
      newIndex: 1,
    });
  });

  it('returns undefined for unsupported keys', () => {
    expect(
      getNewIndex({ activeIndex: 1, key: 'Enter', tabsLength: 3 }),
    ).toBeUndefined();
  });

  it('returns undefined when there are no tabs', () => {
    expect(
      getNewIndex({ activeIndex: 0, key: 'ArrowRight', tabsLength: 0 }),
    ).toBeUndefined();
  });
});
