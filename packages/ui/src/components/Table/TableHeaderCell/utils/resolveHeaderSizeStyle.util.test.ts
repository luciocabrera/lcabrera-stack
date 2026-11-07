import { describe, expect, it } from 'vite-plus/test';

import { tableHeaderCellStyles } from '../TableHeaderCell.stylex';
import { resolveHeaderSizeStyle } from './resolveHeaderSizeStyle.util';

const PIN = {
  isFirstPinnedRight: false,
  isLastPinnedLeft: false,
  offset: 0,
  side: 'left',
} as const;

describe('resolveHeaderSizeStyle', () => {
  it('sizes a virtual header by its base style alone', () => {
    expect(
      resolveHeaderSizeStyle({ column: {}, layout: 'virtual' }),
    ).toBeUndefined();
  });

  it('grows an unsized, unpinned virtual fill header only', () => {
    const column = { width: 'fill' } as const;

    expect(resolveHeaderSizeStyle({ column, layout: 'virtual' })).toBe(
      tableHeaderCellStyles.fill,
    );
    expect(
      resolveHeaderSizeStyle({ column, layout: 'virtual', sizedWidth: 90 }),
    ).toBeUndefined();
    expect(
      resolveHeaderSizeStyle({ column, layout: 'virtual', pinInfo: PIN }),
    ).toBeUndefined();
  });

  it('gives a static header its declared or stored width', () => {
    expect(
      resolveHeaderSizeStyle({
        column: { minWidth: 40, width: 'fill' },
        layout: 'static',
      }),
    ).toStrictEqual(
      tableHeaderCellStyles.staticLayout({
        maxWidth: undefined,
        minWidth: 40,
        width: '100%',
      }),
    );
    expect(
      resolveHeaderSizeStyle({
        column: { width: 'fill' },
        layout: 'static',
        sizedWidth: 180,
      }),
    ).toStrictEqual(
      tableHeaderCellStyles.staticLayout({
        maxWidth: undefined,
        minWidth: undefined,
        width: 180,
      }),
    );
  });
});
