import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import {
  TABLE_CELL_BUILT_IN_RENDERERS,
  TABLE_CELL_NEUTRAL_TONE,
} from '#ui/components/Table/cellRenderers/cellRenderers.constants';
import { mergeTableCellRenderers } from '#ui/components/Table/cellRenderers/mergeTableCellRenderers.util';
import { validateTableCellCall } from '#ui/components/Table/cellRenderers/validateTableCellCall.util';

import { resolveOwnCellChildren } from './resolveOwnCellChildren.util';

type Row = { readonly amount: number };

const COLUMN: TableColumn<Row> = {
  cell: { kind: 'text' },
  dataType: 'number',
  key: 'amount',
  label: 'Amount',
};

const cellCall = {
  outcome: validateTableCellCall({
    call: { kind: 'text' },
    renderers: mergeTableCellRenderers([TABLE_CELL_BUILT_IN_RENDERERS]),
  }),
  tone: () => TABLE_CELL_NEUTRAL_TONE,
};

const BASE = {
  cellCall,
  col: COLUMN,
  isLoadingState: false,
  row: { amount: 2 },
  value: 2,
};

describe('resolveOwnCellChildren', () => {
  it('lets render output win, without a type to align by', () => {
    expect(resolveOwnCellChildren({ ...BASE, customActions: 'own' })).toEqual({
      children: 'own',
      dataType: undefined,
    });
  });

  it('draws the call and keeps the column type when render gives nothing', () => {
    const own = resolveOwnCellChildren({ ...BASE, customActions: undefined });

    expect(own?.dataType).toBe('number');
    expect(own?.children).toBeDefined();
  });

  it('answers undefined when neither applies', () => {
    expect(
      resolveOwnCellChildren({
        ...BASE,
        cellCall: undefined,
        customActions: undefined,
      }),
    ).toBeUndefined();
  });
});
