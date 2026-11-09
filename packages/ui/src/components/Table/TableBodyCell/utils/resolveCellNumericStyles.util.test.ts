import { describe, expect, it } from 'vite-plus/test';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';
import { resolveCellNumericStyles } from './resolveCellNumericStyles.util';

describe('resolveCellNumericStyles', () => {
  it.each(['number', 'currency'] as const)(
    'sets tabular figures on a %s cell',
    (dataType) => {
      expect(
        resolveCellNumericStyles({ dataType, isAlignedByDataType: true }),
      ).toBe(tableBodyCellStyles.tabularFigures);
    },
  );

  it.each(['boolean', 'date', 'string'] as const)(
    'leaves a %s cell proportional',
    (dataType) => {
      expect(
        resolveCellNumericStyles({ dataType, isAlignedByDataType: true }),
      ).toBe(false);
    },
  );

  it('leaves supplied content of an undeclared type alone', () => {
    expect(
      resolveCellNumericStyles({
        dataType: 'number',
        isAlignedByDataType: false,
      }),
    ).toBe(false);
  });

  it('sets tabular figures on a cell of a numeric column whatever its content', () => {
    expect(
      resolveCellNumericStyles({
        dataType: 'string',
        isAlignedByDataType: false,
        isNumeric: true,
      }),
    ).toBe(tableBodyCellStyles.tabularFigures);
  });
});
