// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import type {
  ColumnSizingState,
  TableColumn,
} from '#ui/components/Table/Table.types';

import {
  useGetColumns,
  useGetColumnSizing,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';
import { TableDataProvider } from '#ui/components/Table/contexts/TableData/TableDataContext.provider';

import type { TableConfigProviderProps } from './TableConfigContext.types';

import { useGetTableGroupingKeys } from './grouping/selectors';
import { TableConfigProvider } from './TableConfigContext.provider';
import { useTableConfigContextValue } from './useTableConfigContextValue.hook';

type HarnessProps = {
  readonly columnsState?: TableConfigProviderProps<TestRow>['columnsState'];
  readonly groupingState?: TableConfigProviderProps<TestRow>['groupingState'];
  readonly metaState?: TableConfigProviderProps<TestRow>['metaState'];
  readonly revalidation: number;
};

type TestRow = {
  readonly id: number;
  readonly name: string;
};

const mounts = { config: 0, data: 0 };

const ConfigMountCounter = () => {
  useEffect(() => {
    mounts.config += 1;
  }, []);

  return <span data-testid='config-mount' />;
};

const DataMountCounter = () => {
  useEffect(() => {
    mounts.data += 1;
  }, []);

  return <span data-testid='data-mount' />;
};

const ID_COLUMN: TableColumn<TestRow> = { key: 'id', label: 'ID' };
const NAME_COLUMN: TableColumn<TestRow> = { key: 'name', label: 'Name' };
const DEFAULT_COLUMNS_STATE = { columns: [ID_COLUMN] };
const GROUPING_ORDER_STATUS = { keys: ['order_status'] };
const META_STATE = { persistenceKey: 'orders' };

const Probe = () => {
  const { columnsStore, groupingStore } = useTableConfigContextValue<TestRow>();
  const groupingKeys = useGetTableGroupingKeys();
  const columns = useGetColumns<TestRow>();
  const columnSizing = useGetColumnSizing<TestRow>();
  const data = useGetTableData<TestRow>();

  const handleRegroup = () => {
    groupingStore.set({ keys: ['priority'] });
  };

  const handleResize = () => {
    columnsStore.set({
      columnSizing: { id: 180 } as ColumnSizingState<TestRow>,
    });
  };

  return (
    <>
      <button onClick={handleRegroup} type='button'>
        regroup
      </button>
      <button onClick={handleResize} type='button'>
        resize
      </button>
      <output data-testid='grouping'>{groupingKeys.join(',')}</output>
      <output data-testid='columns'>
        {columns.map((column) => column.key).join(',')}
      </output>
      <output data-testid='sizing'>{JSON.stringify(columnSizing)}</output>
      <output data-testid='data'>{data.map((row) => row.id).join(',')}</output>
    </>
  );
};

const Harness = ({
  columnsState = DEFAULT_COLUMNS_STATE,
  groupingState,
  metaState = META_STATE,
  revalidation,
}: HarnessProps) => (
  <TableConfigProvider<TestRow>
    columnsState={columnsState}
    groupingState={groupingState}
    metaState={metaState}
  >
    <ConfigMountCounter />
    <TableDataProvider<TestRow>
      dataState={{ data: [{ id: revalidation, name: 'row' }] }}
      key={revalidation}
    >
      <DataMountCounter />
      <Probe />
    </TableDataProvider>
  </TableConfigProvider>
);

const readProbe = (testId: string) => screen.getByTestId(testId).textContent;

const SIZED_COLUMNS_STATE = {
  columns: [ID_COLUMN],
  columnSizing: { id: 120 } as ColumnSizingState<TestRow>,
};

const WIDER_COLUMNS_STATE = { columns: [ID_COLUMN, NAME_COLUMN] };

describe('TableConfigProvider', () => {
  beforeEach(() => {
    mounts.config = 0;
    mounts.data = 0;
  });

  afterEach(cleanup);

  it('seeds the grouping store from the keys the loader applied', () => {
    render(<Harness groupingState={GROUPING_ORDER_STATUS} revalidation={1} />);

    expect(readProbe('grouping')).toBe('order_status');
  });

  it('defaults the grouping store to ungrouped when the loader applied none', () => {
    render(<Harness revalidation={1} />);

    expect(readProbe('grouping')).toBe('');
  });

  it('keeps grouping across a data revalidation that re-creates the data context', () => {
    const { rerender } = render(
      <Harness groupingState={GROUPING_ORDER_STATUS} revalidation={1} />,
    );

    fireEvent.click(screen.getByText('regroup'));

    expect(readProbe('grouping')).toBe('priority');
    expect(readProbe('data')).toBe('1');

    rerender(
      <Harness groupingState={GROUPING_ORDER_STATUS} revalidation={2} />,
    );

    expect(mounts.data).toBe(2);
    expect(mounts.config).toBe(1);
    expect(readProbe('data')).toBe('2');
    expect(readProbe('grouping')).toBe('priority');
  });

  it('replaces columns when the incoming columns snapshot identity changes', () => {
    const { rerender } = render(
      <Harness columnsState={{ columns: [ID_COLUMN] }} revalidation={1} />,
    );

    expect(readProbe('columns')).toBe('id');

    rerender(<Harness columnsState={WIDER_COLUMNS_STATE} revalidation={1} />);

    expect(mounts.config).toBe(1);
    expect(readProbe('columns')).toBe('id,name');
  });

  it('keeps column sizing across later snapshots that omit or empty the layout', () => {
    const { rerender } = render(
      <Harness columnsState={SIZED_COLUMNS_STATE} revalidation={1} />,
    );

    fireEvent.click(screen.getByText('resize'));
    expect(readProbe('sizing')).toBe('{"id":180}');

    rerender(<Harness columnsState={WIDER_COLUMNS_STATE} revalidation={1} />);

    expect(mounts.config).toBe(1);
    expect(readProbe('columns')).toBe('id,name');
    expect(readProbe('sizing')).toBe('{"id":180}');

    rerender(
      <Harness
        columnsState={{
          columnOrder: [],
          columnPinning: { left: [], right: [] },
          columns: [ID_COLUMN, NAME_COLUMN],
          columnSizing: {} as ColumnSizingState<TestRow>,
          columnVisibility: new Set(),
        }}
        metaState={{
          isColumnLayoutTransient: true,
          persistenceKey: 'orders',
        }}
        revalidation={1}
      />,
    );

    expect(readProbe('sizing')).toBe('{"id":180}');
  });

  it('replaces grouping when the incoming grouping snapshot identity changes', () => {
    const { rerender } = render(
      <Harness groupingState={{ keys: ['order_status'] }} revalidation={1} />,
    );

    fireEvent.click(screen.getByText('regroup'));
    expect(readProbe('grouping')).toBe('priority');

    rerender(
      <Harness groupingState={{ keys: ['customer'] }} revalidation={1} />,
    );

    expect(mounts.config).toBe(1);
    expect(readProbe('grouping')).toBe('customer');
  });
});
