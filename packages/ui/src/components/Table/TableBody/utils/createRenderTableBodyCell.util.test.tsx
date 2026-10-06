// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableCellCallOutcome } from '#ui/components/Table/cellRenderers/cellRenderers.types';
import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableCellRenderer,
  TableColumn,
} from '#ui/components/Table/Table.types';

type MockTableBodyCellProps = {
  readonly children?: ReactNode;
  readonly value?: unknown;
};

const { MockTableBodyCell } = vi.hoisted(() => ({
  MockTableBodyCell: ({ children, value }: MockTableBodyCellProps) => (
    <td data-testid='mock-table-body-cell'>
      {children ??
        (typeof value === 'number' ? value : ((value as ReactNode) ?? ''))}
    </td>
  ),
}));

vi.mock('#ui/components/Table/TableBodyCell', () => ({
  TableBodyCell: MockTableBodyCell,
}));

import { TABLE_CELL_NEUTRAL_TONE } from '#ui/components/Table/cellRenderers/cellRenderers.constants';

import { createRenderTableBodyCell } from './createRenderTableBodyCell.util';

type Row = {
  readonly amount?: number;
  readonly name?: string;
};

type RowKey = DataKey<Row>;

const NO_CELL_CALLS = new Map<string, TableCellCallOutcome>();
const ROW_INDEX = 3;
const ROW_KEY = 'pk:[3]';

afterEach(cleanup);

type RenderUnsizedCellArgs = {
  readonly cellCalls?: ReadonlyMap<string, TableCellCallOutcome>;
  readonly col: TableColumn<Row>;
  readonly row: Row;
};

const renderUnsizedCell = ({
  cellCalls = NO_CELL_CALLS,
  col,
  row,
}: RenderUnsizedCellArgs) => {
  const renderBodyCell = createRenderTableBodyCell<Row>({
    cellCalls,
    columnSizing: {} as ColumnSizingState<Row>,
    groupingKeys: [],
    isLoadingState: false,
    pinnedOffsets: {} as Record<RowKey, PinnedColumnInfo>,
    tone: () => TABLE_CELL_NEUTRAL_TONE,
  });

  render(
    <table>
      <tbody>
        <tr>
          {renderBodyCell({
            carriedGroupKeys: new Set<string>(),
            col,
            hasStructuralMarker: false,
            row,
            rowIndex: ROW_INDEX,
            rowKey: ROW_KEY,
          })}
        </tr>
      </tbody>
    </table>,
  );
};

describe('createRenderTableBodyCell', () => {
  it('renders default TableBodyCell output', () => {
    const col: TableColumn<Row> = {
      key: 'amount',
      label: 'Amount',
      minWidth: 100,
    };
    renderUnsizedCell({ col, row: { amount: 12 } });

    expect(screen.getByText('12').textContent).toBe('12');
  });

  it('renders custom TableBodyCell output', () => {
    const col: TableColumn<Row> = {
      key: 'name',
      label: 'Name',
      render: (row) => `custom:${String(row.name)}`,
    };
    renderUnsizedCell({ col, row: { name: 'Z' } });

    expect(screen.getByText('custom:Z').textContent).toBe('custom:Z');
  });

  it('hands a column its resolved cell call', () => {
    const col: TableColumn<Row> = {
      cell: { kind: 'gauge' },
      key: 'name',
      label: 'Name',
    };
    const gauge: TableCellRenderer = {
      kind: 'gauge',
      params: {
        '~standard': {
          validate: () => ({ value: {} }),
          vendor: 'test',
          version: 1,
        },
      },
      render: ({ value }) => `gauge:${String(value)}`,
    };

    renderUnsizedCell({
      cellCalls: new Map([
        [
          'name',
          { kind: 'gauge', params: {}, renderer: gauge, status: 'resolved' },
        ],
      ]),
      col,
      row: { name: 'Z' },
    });

    expect(screen.getByText('gauge:Z').textContent).toBe('gauge:Z');
  });

  it('applies sizing and pin metadata', () => {
    const col: TableColumn<Row> = {
      key: 'name',
      label: 'Name',
      minWidth: 90,
    };
    const renderBodyCell = createRenderTableBodyCell<Row>({
      cellCalls: NO_CELL_CALLS,
      columnSizing: { name: 160 } as ColumnSizingState<Row>,
      groupingKeys: [],
      isLoadingState: false,
      pinnedOffsets: {
        name: {
          isFirstPinnedRight: false,
          isLastPinnedLeft: true,
          offset: 16,
          side: 'left',
        },
      } as Record<RowKey, PinnedColumnInfo>,
      tone: () => TABLE_CELL_NEUTRAL_TONE,
    });

    render(
      <table>
        <tbody>
          <tr>
            {renderBodyCell({
              carriedGroupKeys: new Set<string>(),
              col,
              hasStructuralMarker: false,
              row: { name: 'A' },
              rowIndex: ROW_INDEX,
              rowKey: ROW_KEY,
            })}
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByTestId('mock-table-body-cell').tagName).toBe('TD');
  });
});
