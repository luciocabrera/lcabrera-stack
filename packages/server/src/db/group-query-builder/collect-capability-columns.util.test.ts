import { describe, expect, it } from 'vite-plus/test';

import { collectCapabilityColumns } from './collect-capability-columns.util.ts';

describe('collectCapabilityColumns', () => {
  it('collects the group keys and every aggregate column', () => {
    expect(
      collectCapabilityColumns({
        aggregates: [
          { column: 'amount', fn: 'sum' },
          { column: 'quantity', fn: 'avg' },
        ],
        keys: ['country'],
      }),
    ).toStrictEqual(['country', 'amount', 'quantity']);
  });

  it('contributes no column for count(*)', () => {
    expect(
      collectCapabilityColumns({
        aggregates: [{ fn: 'count' }],
        keys: ['country'],
      }),
    ).toStrictEqual(['country']);
  });

  it('de-duplicates a column that is both a key and an aggregate target', () => {
    expect(
      collectCapabilityColumns({
        aggregates: [
          { column: 'country', fn: 'count' },
          { column: 'country', fn: 'max' },
        ],
        keys: ['country'],
      }),
    ).toStrictEqual(['country']);
  });

  it('answers nothing for no keys and no aggregate columns', () => {
    expect(
      collectCapabilityColumns({ aggregates: [{ fn: 'count' }], keys: [] }),
    ).toStrictEqual([]);
  });

  it('includes a column-axis key that is not already a row key', () => {
    expect(
      collectCapabilityColumns({
        aggregates: [{ fn: 'count' }],
        columnAxisKey: 'year',
        keys: ['region'],
      }),
    ).toStrictEqual(['region', 'year']);
  });

  it('keeps a joined reference and collects it once', () => {
    const rating = { column: 'rating', source: 'vendor' };

    expect(
      collectCapabilityColumns({
        aggregates: [{ column: rating, fn: 'avg' }],
        columnAxisKey: 'status',
        keys: [rating],
      }),
    ).toStrictEqual([rating, 'status']);
  });
});
