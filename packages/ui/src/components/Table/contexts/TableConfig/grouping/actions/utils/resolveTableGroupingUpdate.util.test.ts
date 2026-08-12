import { describe, expect, it } from 'vite-plus/test';

import { resolveTableGroupingUpdate } from './resolveTableGroupingUpdate.util';

describe('resolveTableGroupingUpdate', () => {
  it('groups an ungrouped table by the requested key', () => {
    expect(
      resolveTableGroupingUpdate({
        columnKey: 'order_status',
        existingKeys: [],
      }),
    ).toStrictEqual({
      keys: ['order_status'],
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'grouping',
        searchParamValue: '{"keys":["order_status"]}',
      },
    });
  });

  it('replaces the current key rather than appending to it', () => {
    const result = resolveTableGroupingUpdate({
      columnKey: 'priority',
      existingKeys: ['order_status'],
    });

    expect(result.kind).toBe('updated');
    expect(result.kind === 'updated' && result.keys).toStrictEqual([
      'priority',
    ]);
  });

  it('clears grouping and drops the param when the key is undefined', () => {
    expect(
      resolveTableGroupingUpdate({
        columnKey: undefined,
        existingKeys: ['order_status'],
      }),
    ).toStrictEqual({
      keys: [],
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'grouping',
        searchParamValue: undefined,
      },
    });
  });

  it('reports unchanged when the requested key is already the applied one', () => {
    // This is what keeps one interaction to one navigation: without it a repeat
    // click would persist and redirect to the state the table already holds.
    expect(
      resolveTableGroupingUpdate({
        columnKey: 'order_status',
        existingKeys: ['order_status'],
      }),
    ).toStrictEqual({ kind: 'unchanged' });
  });

  it('reports unchanged when clearing an already ungrouped table', () => {
    expect(
      resolveTableGroupingUpdate({ columnKey: undefined, existingKeys: [] }),
    ).toStrictEqual({ kind: 'unchanged' });
  });
});
