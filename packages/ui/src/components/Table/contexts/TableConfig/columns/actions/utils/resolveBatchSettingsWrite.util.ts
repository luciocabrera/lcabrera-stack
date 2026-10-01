import type { resolveTableGroupingUpdate } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';
import type {
  TableGroupingState,
  TableMetaState,
  TablePersistenceEntry,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { buildUiFlagsCookieEntry } from '#ui/components/Table/contexts/TableConfig/meta/actions/utils';

import { resolveCommittedGroupingState } from './resolveCommittedGroupingState.util';

type ResolveBatchSettingsWriteArgs = {
  readonly currentGrouping: TableGroupingState;
  readonly groupingUpdate: ReturnType<typeof resolveTableGroupingUpdate>;
  readonly hasLiveQueryChanged: boolean;
  readonly hasPlacementChanged: boolean;
  readonly metaState: Partial<TableMetaState> | undefined;
  readonly stateEntries: readonly TablePersistenceEntry[];
  readonly totalsPlacement: TableTotalsPlacement;
};

export const resolveBatchSettingsWrite = ({
  currentGrouping,
  groupingUpdate,
  hasLiveQueryChanged,
  hasPlacementChanged,
  metaState,
  stateEntries,
  totalsPlacement,
}: ResolveBatchSettingsWriteArgs) => {
  const isClosesSettings = metaState?.isTableSettingsPinned !== true;
  const nextStatePatch = isClosesSettings
    ? { isTableSettingsOpen: false as const }
    : {};
  const shouldPersistUiFlags = hasPlacementChanged || isClosesSettings;
  const uiFlagsEntry = shouldPersistUiFlags
    ? buildUiFlagsCookieEntry({
        currentState: metaState,
        nextStatePatch,
        totalsPlacement,
      })
    : undefined;
  const persistRequest =
    hasLiveQueryChanged && uiFlagsEntry
      ? {
          cookieEntries: [uiFlagsEntry],
          entries: stateEntries,
        }
      : stateEntries;
  const committedGrouping =
    hasPlacementChanged || groupingUpdate.kind === 'updated'
      ? resolveCommittedGroupingState({
          currentGrouping,
          groupingUpdate,
          totalsPlacement,
        })
      : undefined;
  const separateUiFlags =
    shouldPersistUiFlags && !(hasLiveQueryChanged && uiFlagsEntry)
      ? {
          currentState: metaState,
          nextStatePatch,
          totalsPlacement,
        }
      : undefined;

  return {
    closesSettings: isClosesSettings,
    committedGrouping,
    nextStatePatch,
    persistRequest,
    separateUiFlags,
  };
};
