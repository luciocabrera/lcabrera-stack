import { describe, expect, it } from 'vite-plus/test';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';
import { resolveCellLayoutStyles } from './resolveCellLayoutStyles.util';

describe('resolveCellLayoutStyles', () => {
  it('adds nothing for a cell with no layout of its own', () => {
    expect(resolveCellLayoutStyles({})).toStrictEqual([]);
  });

  it('maps each explicit alignment to its style', () => {
    expect(resolveCellLayoutStyles({ align: 'start' })).toStrictEqual([
      tableBodyCellStyles.alignStart,
    ]);
    expect(resolveCellLayoutStyles({ align: 'center' })).toStrictEqual([
      tableBodyCellStyles.alignCenter,
    ]);
    expect(resolveCellLayoutStyles({ align: 'end' })).toStrictEqual([
      tableBodyCellStyles.alignRight,
    ]);
  });

  it('orders the static layout, then the alignment, then the fill growth', () => {
    const widths = { maxWidth: undefined, minWidth: 40, width: 120 };

    expect(
      resolveCellLayoutStyles({
        align: 'end',
        isFill: true,
        staticWidths: widths,
      }),
    ).toStrictEqual([
      tableBodyCellStyles.staticLayout(widths),
      tableBodyCellStyles.alignRight,
      tableBodyCellStyles.fill,
    ]);
  });

  it('adds no fill growth unless asked', () => {
    expect(resolveCellLayoutStyles({ isFill: false })).toStrictEqual([]);
  });
});
