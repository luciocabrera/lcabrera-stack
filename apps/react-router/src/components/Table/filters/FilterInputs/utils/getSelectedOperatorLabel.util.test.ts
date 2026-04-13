import { describe, expect, it } from 'vitest';

import { getSelectedOperatorLabel } from './getSelectedOperatorLabel.util.ts';

const operatorOptions = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Starts with', value: 'startsWith' },
];

describe('getSelectedOperatorLabel', () => {
  it('returns empty array when filter is undefined', () => {
    expect(
      getSelectedOperatorLabel({
        filter: undefined,
        operator: 'equals',
        operatorOptions,
      }),
    ).toEqual([]);
  });

  it('returns label array when operator is found', () => {
    expect(
      getSelectedOperatorLabel({
        filter: { operator: 'contains', type: 'text', value: 'x' },
        operator: 'contains',
        operatorOptions,
      }),
    ).toEqual(['Contains']);
  });

  it('returns empty array when operator is not in options', () => {
    expect(
      getSelectedOperatorLabel({
        filter: { operator: 'notEquals', type: 'text', value: 'x' },
        operator: 'notEquals',
        operatorOptions,
      }),
    ).toEqual([]);
  });
});
