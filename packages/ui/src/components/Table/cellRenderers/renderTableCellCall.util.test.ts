import { describe, expect, it, vi } from 'vite-plus/test';

import type {
  TableCellRenderer,
  TableColumn,
} from '#ui/components/Table/Table.types';

import type { TableCellCallOutcome } from './cellRenderers.types';

import { TABLE_CELL_NEUTRAL_TONE } from './cellRenderers.constants';
import { renderTableCellCall } from './renderTableCellCall.util';

type Row = { readonly score: number };

const tone = () => TABLE_CELL_NEUTRAL_TONE;

const COLUMN: TableColumn<Row> = {
  dataType: 'number',
  format: { number: { minimumFractionDigits: 1 } },
  key: 'score',
  label: 'Score',
};

const render = vi.fn<TableCellRenderer['render']>(() => 'drawn');

const RESOLVED: TableCellCallOutcome = {
  kind: 'x',
  params: { a: 1 },
  renderer: {
    kind: 'x',
    params: {
      '~standard': {
        validate: (value) => ({ value }),
        vendor: 'test',
        version: 1,
      },
    },
    render,
  },
  status: 'resolved',
};

const ROW = { score: 3 };

describe('renderTableCellCall', () => {
  it.each([
    { outcome: undefined },
    { outcome: { kind: 'gauge', status: 'unregistered' } as const },
    { outcome: { issues: [], kind: 'badge', status: 'invalid' } as const },
  ])('renders nothing for $outcome', ({ outcome }) => {
    expect(
      renderTableCellCall({
        cellCall: { outcome, tone },
        col: COLUMN,
        isLoadingState: false,
        row: ROW,
        value: 3,
      }),
    ).toBeUndefined();
  });

  it('renders nothing for a column with no call', () => {
    expect(
      renderTableCellCall({
        cellCall: undefined,
        col: COLUMN,
        isLoadingState: false,
        row: ROW,
        value: 3,
      }),
    ).toBeUndefined();
  });

  it('renders nothing for a loading placeholder row', () => {
    expect(
      renderTableCellCall({
        cellCall: { outcome: RESOLVED, tone },
        col: COLUMN,
        isLoadingState: true,
        row: ROW,
        value: 3,
      }),
    ).toBeUndefined();
  });

  it('hands the cell back to the default path when the renderer draws nothing', () => {
    render.mockReturnValueOnce(undefined);

    expect(
      renderTableCellCall({
        cellCall: { outcome: RESOLVED, tone },
        col: COLUMN,
        isLoadingState: false,
        row: ROW,
        value: 3,
      }),
    ).toBeUndefined();
  });

  it('hands the renderer its validated params, the row, the value and the formatted default', () => {
    expect(
      renderTableCellCall({
        cellCall: { outcome: RESOLVED, tone },
        col: COLUMN,
        isLoadingState: false,
        row: ROW,
        value: 3,
      }),
    ).toEqual({ content: 'drawn' });
    expect(render).toHaveBeenCalledWith({
      formatted: '3.0',
      params: { a: 1 },
      row: ROW,
      tone,
      value: 3,
    });
  });
});
