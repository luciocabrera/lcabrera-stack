import { describe, expect, it } from 'vite-plus/test';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';
import { resolveCellDataTypeAlignStyles } from './resolveCellDataTypeAlignStyles.util';

describe('resolveCellDataTypeAlignStyles', () => {
  it.each(['number', 'currency'] as const)(
    'right-aligns a %s cell',
    (dataType) => {
      expect(
        resolveCellDataTypeAlignStyles({ dataType, isAlignedByDataType: true }),
      ).toStrictEqual([tableBodyCellStyles.alignRight, false]);
    },
  );

  it.each(['boolean', 'date'] as const)('centres a %s cell', (dataType) => {
    expect(
      resolveCellDataTypeAlignStyles({ dataType, isAlignedByDataType: true }),
    ).toStrictEqual([false, tableBodyCellStyles.alignCenter]);
  });

  it('leaves a string cell at the start', () => {
    expect(
      resolveCellDataTypeAlignStyles({
        dataType: 'string',
        isAlignedByDataType: true,
      }),
    ).toStrictEqual([false, false]);
  });

  it('defers to an explicit alignment and to supplied content', () => {
    expect(
      resolveCellDataTypeAlignStyles({
        align: 'start',
        dataType: 'number',
        isAlignedByDataType: true,
      }),
    ).toStrictEqual([false, false]);
    expect(
      resolveCellDataTypeAlignStyles({
        dataType: 'date',
        isAlignedByDataType: false,
      }),
    ).toStrictEqual([false, false]);
  });
});
