import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

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
        minWidth: DEFAULT_MIN_COLUMN_WIDTH,
        width: 180,
      }),
    );
  });

  it('keeps a static header at the virtual minimum width when its column declares none', () => {
    expect(
      resolveHeaderSizeStyle({ column: {}, layout: 'static' }),
    ).toStrictEqual(
      tableHeaderCellStyles.staticLayout({
        maxWidth: undefined,
        minWidth: DEFAULT_MIN_COLUMN_WIDTH,
        width: undefined,
      }),
    );
  });

  it('keeps a static header within a declared maximum below the virtual minimum width', () => {
    expect(
      resolveHeaderSizeStyle({ column: { maxWidth: 40 }, layout: 'static' }),
    ).toStrictEqual(
      tableHeaderCellStyles.staticLayout({
        maxWidth: 40,
        minWidth: 40,
        width: undefined,
      }),
    );
  });
});
