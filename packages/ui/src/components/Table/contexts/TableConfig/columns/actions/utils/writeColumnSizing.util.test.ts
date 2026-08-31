import { beforeEach, describe, expect, it } from 'vite-plus/test';

import type { TableColumnsState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { createTableConfigColumnsActionMocks } from '#ui/utils/tests/createTableConfigColumnsActionMocks.util';

import { writeColumnSizing } from './writeColumnSizing.util';

type Row = { readonly id: string; readonly name: string };

const createInitialColumnsState = () => ({
  columnPinning: { left: ['id'], right: [] },
  columnSizing: { id: 100 } as Record<string, number>,
  effectiveColumns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
  ],
});

const { mockColumnsStore, resetMocks, setColumnsState } =
  createTableConfigColumnsActionMocks({
    initialColumnsState: createInitialColumnsState(),
    persistenceKey: 'orders-table',
  });

const columnsStore = mockColumnsStore as unknown as TStore<
  TableColumnsState<Row>
>;

describe('writeColumnSizing', () => {
  beforeEach(() => {
    setColumnsState(createInitialColumnsState());
    resetMocks();
  });

  it('adds the new width alongside the widths already stored', () => {
    writeColumnSizing<Row>({ columnKey: 'name', columnsStore, width: 220 });

    expect(mockColumnsStore.get().columnSizing).toEqual({ id: 100, name: 220 });
  });

  it('drops the column back to its default when the width is undefined', () => {
    setColumnsState({
      ...createInitialColumnsState(),
      columnSizing: { id: 100, name: 220 },
    });

    writeColumnSizing<Row>({
      columnKey: 'name',
      columnsStore,
      width: undefined,
    });

    expect(mockColumnsStore.get().columnSizing).toEqual({ id: 100 });
  });

  it('leaves the other columns untouched', () => {
    writeColumnSizing<Row>({ columnKey: 'name', columnsStore, width: 220 });

    expect(mockColumnsStore.get().columnSizing.id).toBe(100);
  });

  it('recomputes the pinned offsets that depend on the new width', () => {
    writeColumnSizing<Row>({ columnKey: 'id', columnsStore, width: 180 });

    expect(mockColumnsStore.set).toHaveBeenCalledTimes(1);
    expect(mockColumnsStore.get()).toHaveProperty('pinnedColumnOffsets');
  });
});
