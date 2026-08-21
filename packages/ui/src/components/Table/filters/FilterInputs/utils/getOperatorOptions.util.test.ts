import { describe, expect, it } from 'vite-plus/test';

import type { TableColumnDataType } from '#ui/components/Table/Table.types';

import {
  DATE_OPERATORS,
  EMPTY_OPERATORS,
  NUMBER_OPERATORS,
  TEXT_OPERATORS,
} from '#ui/constants/filterOperators.constants';

import { getOperatorOptions } from './getOperatorOptions.util';

describe('getOperatorOptions', () => {
  it('offers the number operators for number and currency columns', () => {
    for (const dataType of ['currency', 'number'] as const) {
      expect(getOperatorOptions({ dataType })).toStrictEqual([
        ...NUMBER_OPERATORS,
        ...EMPTY_OPERATORS,
      ]);
    }
  });

  it('offers the date operators for date columns', () => {
    expect(getOperatorOptions({ dataType: 'date' })).toStrictEqual([
      ...DATE_OPERATORS,
      ...EMPTY_OPERATORS,
    ]);
  });

  it('falls back to the text operators for everything else', () => {
    const fallbackTypes: readonly (TableColumnDataType | undefined)[] = [
      'boolean',
      'string',
      undefined,
    ];

    for (const dataType of fallbackTypes) {
      expect(getOperatorOptions({ dataType })).toStrictEqual([
        ...TEXT_OPERATORS,
        ...EMPTY_OPERATORS,
      ]);
    }
  });

  it('offers the empty operators for every column type', () => {
    // Emptiness is not a comparison and has no family: the data type decides
    // which comparisons make sense, not whether a column can hold nothing. A
    // list missing these is a column a user cannot ask the question of.
    const dataTypes: readonly (TableColumnDataType | undefined)[] = [
      'boolean',
      'currency',
      'date',
      'number',
      'string',
      undefined,
    ];

    for (const dataType of dataTypes) {
      const values = getOperatorOptions({ dataType }).map((op) => op.value);

      expect(values).toContain('isEmpty');
      expect(values).toContain('isNotEmpty');
    }
  });
});
