import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnFiltersState,
  ColumnSizingState,
  TableColumnsState,
} from '#ui/components/Table/Table.types';

import { getInitialGroupingState } from '#ui/components/Table/contexts/TableConfig/utils';

import type { BatchTableSettingsUpdate } from './resolveBatchTableSettingsUpdate.util';

import { resolveBatchSettingsPlan } from './resolveBatchSettingsPlan.util';

type Row = {
  readonly name: string;
};

const grouping = getInitialGroupingState({});
const grouped = getInitialGroupingState({ keys: ['name'] });

const settings: BatchTableSettingsUpdate<Row> = {
  columnFilters: {} as ColumnFiltersState<Row>,
  columnOrder: ['name'],
  columnPinning: { left: [], right: [] },
  columnSizing: {} as ColumnSizingState<Row>,
  columnVisibility: new Set(['name']),
  sorting: [],
};

const columnsState: Partial<TableColumnsState<Row>> = {
  columnFilters: {} as ColumnFiltersState<Row>,
  columns: [{ key: 'name', label: 'Name' }],
  sorting: [],
};

const metaState = {
  isTableSettingsPinned: false,
  persistenceKey: 'orders',
};

const planFor = (
  patch: Partial<Parameters<typeof resolveBatchSettingsPlan<Row>>[0]> = {},
) =>
  resolveBatchSettingsPlan<Row>({
    columnsState,
    currentGrouping: grouping,
    data: [],
    grouping,
    metaState,
    settings,
    totalsPlacement: 'last',
    ...patch,
  });

describe('resolveBatchSettingsPlan', () => {
  it('folds the closed panel into the query write when the query changes', () => {
    const plan = planFor({
      settings: {
        ...settings,
        sorting: [{ columnKey: 'name', direction: 'asc' }],
      },
    });

    expect(plan.hasLiveQueryChanged).toBe(true);
    expect(plan.closesSettings).toBe(true);
    expect(plan.separateUiFlags).toBeUndefined();
    expect(plan.persistRequest).toEqual(
      expect.objectContaining({
        cookieEntries: [expect.anything()],
      }),
    );
  });

  it('writes the closed panel on its own when the query is unchanged', () => {
    const plan = planFor();

    expect(plan.hasLiveQueryChanged).toBe(false);
    expect(plan.separateUiFlags).toEqual({
      currentState: metaState,
      nextStatePatch: { isTableSettingsOpen: false },
      totalsPlacement: 'last',
    });
    expect(Array.isArray(plan.persistRequest)).toBe(true);
  });

  it('leaves a pinned panel open when nothing else changed', () => {
    const plan = planFor({
      metaState: { ...metaState, isTableSettingsPinned: true },
    });

    expect(plan.closesSettings).toBe(false);
    expect(plan.committedGrouping).toBeUndefined();
    expect(plan.separateUiFlags).toBeUndefined();
    expect(plan.hasLiveQueryChanged).toBe(false);
  });

  it('commits grouping when the group keys change', () => {
    const plan = planFor({ grouping: grouped });

    expect(plan.hasLiveQueryChanged).toBe(true);
    expect(plan.committedGrouping).toMatchObject({ keys: ['name'] });
  });
});
