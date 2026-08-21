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

  it('offers the empty operators for every operator family', () => {
    // Emptiness is not a comparison and has no family: the data type decides
    // which comparisons make sense, not whether a column can hold nothing. A
    // list missing these is a column a user cannot ask the question of.
    //
    // `'boolean'` is deliberately absent. `FilterInputs` returns
    // `BooleanFilterInput` for a boolean column before any `OperatorSelect` is
    // rendered, so nothing ever reads this list for one — asserting it here
    // would pass whether or not a boolean column offered the operators, which
    // is no assertion at all. `BooleanFilterInput`'s own test covers that path.
    const dataTypes: readonly (TableColumnDataType | undefined)[] = [
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
