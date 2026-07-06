// @vitest-environment jsdom

import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';
import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@repo/ui/components/Table/TableBodyCell', () => ({
  TableBodyCell: MockTableBodyCell,
}));

import { createRenderTableBodyCell } from './createRenderTableBodyCell.util';

type Row = {
  readonly amount?: number;
  readonly name?: string;
};

type RowKey = DataKey<Row>;

afterEach(cleanup);

describe('createRenderTableBodyCell', () => {
  it('renders default TableBodyCell output', () => {
    const col: TableColumn<Row> = {
      key: 'amount',
      label: 'Amount',
      minWidth: 100,
    };
    const renderBodyCell = createRenderTableBodyCell<Row>({
      columnSizing: {} as ColumnSizingState<Row>,
      isLoadingState: false,
      pinnedOffsets: {} as Record<RowKey, PinnedColumnInfo>,
    });

    render(
      <table>
        <tbody>
          <tr>{renderBodyCell({ col, rowData: { amount: 12 } })}</tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('12').textContent).toBe('12');
  });

  it('renders custom TableBodyCell output', () => {
    const col: TableColumn<Row> = {
      key: 'name',
      label: 'Name',
      render: (row) => `custom:${String(row.name)}`,
    };
    const renderBodyCell = createRenderTableBodyCell<Row>({
      columnSizing: {} as ColumnSizingState<Row>,
      isLoadingState: false,
      pinnedOffsets: {} as Record<RowKey, PinnedColumnInfo>,
    });

    render(
      <table>
        <tbody>
          <tr>{renderBodyCell({ col, rowData: { name: 'Z' } })}</tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('custom:Z').textContent).toBe('custom:Z');
  });

  it('applies sizing and pin metadata', () => {
    const col: TableColumn<Row> = {
      key: 'name',
      label: 'Name',
      minWidth: 90,
    };
    const renderBodyCell = createRenderTableBodyCell<Row>({
      columnSizing: { name: 160 } as ColumnSizingState<Row>,
      isLoadingState: false,
      pinnedOffsets: {
        name: {
          isFirstPinnedRight: false,
          isLastPinnedLeft: true,
          offset: 16,
          side: 'left',
        },
      } as Record<RowKey, PinnedColumnInfo>,
    });

    render(
      <table>
        <tbody>
          <tr>{renderBodyCell({ col, rowData: { name: 'A' } })}</tr>
        </tbody>
      </table>,
    );

    expect(screen.getByTestId('mock-table-body-cell').tagName).toBe('TD');
  });
});
