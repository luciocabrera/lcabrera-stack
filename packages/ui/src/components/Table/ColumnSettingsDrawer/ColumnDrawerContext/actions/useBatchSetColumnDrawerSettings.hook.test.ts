// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBatchSetColumnDrawerSettings } from './useBatchSetColumnDrawerSettings.hook';

const { batchSetColumnSettingsMock, columnStore, setColumnState } = vi.hoisted(
  () => {
    let columnState:
      | undefined
      | {
          readonly columnFilter?: {
            readonly operator: 'contains';
            readonly type: 'text';
            readonly value: 'ali';
          };
          readonly columnKey: 'name';
          readonly columnPinning?: 'right';
          readonly columnSizing?: 220;
          readonly sorting: 'desc';
        } = {
      columnFilter: {
        operator: 'contains',
        type: 'text',
        value: 'ali',
      },
      columnKey: 'name',
      columnPinning: 'right',
      columnSizing: 220,
      sorting: 'desc',
    };

    return {
      batchSetColumnSettingsMock: vi.fn(),
      columnStore: {
        get: vi.fn(() => columnState),
      },
      setColumnState: (nextState: typeof columnState) => {
        columnState = nextState;
      },
    };
  },
);

vi.mock(
  '@repo/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook',
  () => ({
    useColumnDrawerContextValue: () => ({ columnStore }),
  }),
);

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useBatchSetColumnSettings: () => batchSetColumnSettingsMock,
  }),
);

describe('useBatchSetColumnDrawerSettings', () => {
  beforeEach(() => {
    setColumnState({
      columnFilter: {
        operator: 'contains',
        type: 'text',
        value: 'ali',
      },
      columnKey: 'name',
      columnPinning: 'right',
      columnSizing: 220,
      sorting: 'desc',
    });
    batchSetColumnSettingsMock.mockClear();
    columnStore.get.mockClear();
  });

  it('passes the current drawer snapshot to the table batch action', () => {
    const { result } = renderHook(() =>
      useBatchSetColumnDrawerSettings<{
        readonly age: number;
        readonly id: string;
        readonly name: string;
      }>(),
    );

    act(() => {
      result.current();
    });

    expect(columnStore.get).toHaveBeenCalledTimes(1);
    expect(batchSetColumnSettingsMock).toHaveBeenCalledWith({
      columnFilter: {
        operator: 'contains',
        type: 'text',
        value: 'ali',
      },
      columnKey: 'name',
      columnPinning: 'right',
      columnSizing: 220,
      sorting: 'desc',
    });
  });

  it('returns early when the drawer store has no snapshot', () => {
    setColumnState(undefined);

    const { result } = renderHook(() =>
      useBatchSetColumnDrawerSettings<{
        readonly age: number;
        readonly id: string;
        readonly name: string;
      }>(),
    );

    act(() => {
      result.current();
    });

    expect(batchSetColumnSettingsMock).not.toHaveBeenCalled();
  });
});
