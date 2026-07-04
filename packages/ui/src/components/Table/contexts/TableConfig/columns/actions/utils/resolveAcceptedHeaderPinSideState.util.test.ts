import { describe, expect, it } from 'vitest';

import { resolveAcceptedHeaderPinSideState } from './resolveAcceptedHeaderPinSideState.util';

describe('resolveAcceptedHeaderPinSideState', () => {
  it('returns resolved order and pinning when the header pin can be applied directly', () => {
    const result = resolveAcceptedHeaderPinSideState<{
      readonly age: string;
      readonly id: string;
      readonly name: string;
    }>({
      columnKey: 'name',
      columnOrder: ['name', 'id', 'age'],
      columnPinning: { left: ['id'], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      pinSide: 'left',
      staticKeys: undefined,
    });

    expect(result).toEqual({
      columnOrder: ['id', 'name', 'age'],
      columnPinning: { left: ['id', 'name'], right: [] },
      kind: 'resolved',
    });
  });
});
