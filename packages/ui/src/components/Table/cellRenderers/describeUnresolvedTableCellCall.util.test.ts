import { describe, expect, it } from 'vite-plus/test';

import { TABLE_CELL_TEXT_RENDERER } from '#ui/components/Table/TableCellText/TableCellText.constants';

import { describeUnresolvedTableCellCall } from './describeUnresolvedTableCellCall.util';

describe('describeUnresolvedTableCellCall', () => {
  it('names an unregistered kind', () => {
    expect(
      describeUnresolvedTableCellCall({
        columnKey: 'score',
        outcome: { kind: 'gauge', status: 'unregistered' },
      }),
    ).toBe(
      '[Table] column "score": cell kind "gauge" is not registered; rendering its dataType default.',
    );
  });

  it('names the issues of invalid params', () => {
    expect(
      describeUnresolvedTableCellCall({
        columnKey: 'score',
        outcome: {
          issues: [{ message: 'a' }, { message: 'b' }],
          kind: 'badge',
          status: 'invalid',
        },
      }),
    ).toBe(
      '[Table] column "score": cell kind "badge" has invalid params (a; b); rendering its dataType default.',
    );
  });

  it('says nothing about a resolved call', () => {
    expect(
      describeUnresolvedTableCellCall({
        columnKey: 'name',
        outcome: {
          kind: 'text',
          params: {},
          renderer: TABLE_CELL_TEXT_RENDERER,
          status: 'resolved',
        },
      }),
    ).toBeUndefined();
  });
});
