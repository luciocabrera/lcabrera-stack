import { describe, expect, it } from 'vitest';

import { resolveAcceptedHeaderPinConflictState } from './resolveAcceptedHeaderPinConflictState.util';

describe('resolveAcceptedHeaderPinConflictState', () => {
  it('pins the in-between columns and syncs order for a left conflict resolution', () => {
    const result = resolveAcceptedHeaderPinConflictState<{
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
      resolution: 'pin-all-between',
      side: 'left',
      staticKeys: undefined,
    });

    expect(result).toEqual({
      columnOrder: ['id', 'name', 'age'],
      columnPinning: { left: ['id', 'name'], right: [] },
    });
  });
});
