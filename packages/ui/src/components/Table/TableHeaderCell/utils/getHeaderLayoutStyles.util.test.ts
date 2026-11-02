import { describe, expect, it } from 'vite-plus/test';

import { tableHeaderCellStyles } from '../TableHeaderCell.stylex';
import { getHeaderLayoutStyles } from './getHeaderLayoutStyles.util';

const PIN = {
  isFirstPinnedRight: false,
  isLastPinnedLeft: false,
  offset: 0,
  side: 'left',
} as const;

describe('getHeaderLayoutStyles', () => {
  it('adds nothing for a plain virtual column', () => {
    expect(
      getHeaderLayoutStyles({ column: {}, layout: 'virtual' }),
    ).toStrictEqual({ cell: [undefined], label: [] });
  });

  it('aligns the cell and its label as the column says', () => {
    expect(
      getHeaderLayoutStyles({
        column: { align: 'end' },

        layout: 'virtual',
      }),
    ).toStrictEqual({
      cell: [undefined, tableHeaderCellStyles.alignEnd],
      label: [tableHeaderCellStyles.contentAlignEnd],
    });
    expect(
      getHeaderLayoutStyles({
        column: { align: 'center' },

        layout: 'virtual',
      }).label,
    ).toStrictEqual([tableHeaderCellStyles.contentAlignCenter]);
    expect(
      getHeaderLayoutStyles({
        column: { align: 'start' },

        layout: 'virtual',
      }),
    ).toStrictEqual({
      cell: [undefined, tableHeaderCellStyles.alignStart],
      label: [undefined],
    });
  });

  it('grows a virtual fill column only while it is unsized and unpinned', () => {
    const fill = { width: 'fill' } as const;

    expect(
      getHeaderLayoutStyles({ column: fill, layout: 'virtual' }).cell[0],
    ).toBe(tableHeaderCellStyles.fill);
    expect(
      getHeaderLayoutStyles({ column: fill, layout: 'virtual', sizedWidth: 90 })
        .cell[0],
    ).toBeUndefined();
    expect(
      getHeaderLayoutStyles({
        column: fill,

        layout: 'virtual',
        pinInfo: PIN,
      }).cell[0],
    ).toBeUndefined();
  });

  it('gives a static header the static cell layout', () => {
    expect(
      getHeaderLayoutStyles({
        column: { width: 'fill' },

        layout: 'static',
      }).cell[0],
    ).toStrictEqual(
      tableHeaderCellStyles.staticLayout({
        maxWidth: undefined,
        minWidth: undefined,
        width: '100%',
      }),
    );
  });

  it('gives a resized static header its stored width over the declared one', () => {
    expect(
      getHeaderLayoutStyles({
        column: { width: 'fill' },
        layout: 'static',
        sizedWidth: 180,
      }).cell[0],
    ).toStrictEqual(
      tableHeaderCellStyles.staticLayout({
        maxWidth: undefined,
        minWidth: undefined,
        width: 180,
      }),
    );
  });
});
