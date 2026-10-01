import { describe, expect, it } from 'vite-plus/test';

import { getInitialGroupingState } from '#ui/components/Table/contexts/TableConfig/utils';

import { resolveBatchSettingsWrite } from './resolveBatchSettingsWrite.util';

const grouping = getInitialGroupingState({});

const write = (
  patch: Partial<Parameters<typeof resolveBatchSettingsWrite>[0]> = {},
) =>
  resolveBatchSettingsWrite({
    currentGrouping: grouping,
    groupingUpdate: { kind: 'unchanged' },
    hasLiveQueryChanged: true,
    hasPlacementChanged: false,
    metaState: { isTableSettingsPinned: false, persistenceKey: 'orders' },
    stateEntries: [],
    totalsPlacement: 'last',
    ...patch,
  });

describe('resolveBatchSettingsWrite', () => {
  it('keeps a pinned panel open and skips the flag write', () => {
    const result = write({
      hasLiveQueryChanged: false,
      metaState: { isTableSettingsPinned: true, persistenceKey: 'orders' },
    });

    expect(result.closesSettings).toBe(false);
    expect(result.separateUiFlags).toBeUndefined();
    expect(result.committedGrouping).toBeUndefined();
  });

  it('rides the closed panel on a live query write', () => {
    const result = write();

    expect(result.closesSettings).toBe(true);
    expect(result.separateUiFlags).toBeUndefined();
    expect(result.persistRequest).toEqual(
      expect.objectContaining({ entries: [] }),
    );
  });
});
