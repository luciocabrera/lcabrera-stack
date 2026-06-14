// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTableConfigColumnsActionMocks } from '@/components/test-utils/createTableConfigColumnsActionMocks.util';

import { useSetColumnSizing } from './useSetColumnSizing.hook';

const createInitialColumnsState = () => ({
  columnPinning: { left: ['id'], right: [] },
  columnSizing: { id: 100 },
  effectiveColumns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
  ],
});

const {
  mockColumnsStore,
  mockUseTableConfigContextValue,
  resetMocks,
  setColumnsState,
} = createTableConfigColumnsActionMocks({
  initialColumnsState: createInitialColumnsState(),
  persistenceKey: 'orders-table',
});

const { mockResolveColumnSizingUpdate } = vi.hoisted(() => ({
  mockResolveColumnSizingUpdate: vi.fn(() => ({
    columnSizing: { id: 100, name: 220 },
    pinnedColumnOffsets: {
      id: {
        isFirstPinnedRight: false,
        isLastPinnedLeft: true,
        offset: 0,
        side: 'left',
      },
    },
  })),
}));

vi.mock(
  '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => mockUseTableConfigContextValue(),
  }),
);

vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils')>();

  return {
    ...actual,
    resolveColumnSizingUpdate: mockResolveColumnSizingUpdate,
  };
});

describe('useSetColumnSizing', () => {
  beforeEach(() => {
    setColumnsState(createInitialColumnsState());
    resetMocks();
    mockResolveColumnSizingUpdate.mockClear();
  });

  it('delegates sizing computation to the local util and writes the result to the columns store', () => {
    const { result } = renderHook(() =>
      useSetColumnSizing<{
        readonly id: string;
        readonly name: string;
      }>(),
    );

    act(() => {
      result.current({ columnKey: 'name', width: 220 });
    });

    expect(mockResolveColumnSizingUpdate).toHaveBeenCalledWith({
      columnKey: 'name',
      columnPinning: { left: ['id'], right: [] },
      columnSizingState: { id: 100 },
      effectiveColumns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      width: 220,
    });
    expect(mockColumnsStore.set).toHaveBeenCalledWith({
      columnSizing: { id: 100, name: 220 },
      pinnedColumnOffsets: {
        id: {
          isFirstPinnedRight: false,
          isLastPinnedLeft: true,
          offset: 0,
          side: 'left',
        },
      },
    });
  });
});
