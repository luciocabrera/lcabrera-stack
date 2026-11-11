import type { resolveTableGroupingUpdate } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';
import type {
  TableDensityPatch,
  TableGroupingState,
  TableMetaState,
  TablePersistenceEntry,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { buildUiFlagsCookieEntry } from '#ui/components/Table/contexts/TableConfig/meta/actions/utils';

import { resolveCommittedGroupingState } from './resolveCommittedGroupingState.util';
import { resolveSettingsStatePatch } from './resolveSettingsStatePatch.util';

type ResolveBatchSettingsWriteArgs = {
  readonly currentGrouping: TableGroupingState;
  readonly densityPatch?: TableDensityPatch;
  readonly groupingUpdate: ReturnType<typeof resolveTableGroupingUpdate>;
  readonly hasLiveQueryChanged: boolean;
  readonly hasPlacementChanged: boolean;
  readonly metaState: Partial<TableMetaState> | undefined;
  readonly stateEntries: readonly TablePersistenceEntry[];
  readonly totalsPlacement: TableTotalsPlacement;
};

export const resolveBatchSettingsWrite = ({
  currentGrouping,
  densityPatch,
  groupingUpdate,
  hasLiveQueryChanged,
  hasPlacementChanged,
  metaState,
  stateEntries,
  totalsPlacement,
}: ResolveBatchSettingsWriteArgs) => {
  const { closesSettings, hasDensityChanged, nextStatePatch } =
    resolveSettingsStatePatch({ densityPatch, metaState });
  const shouldPersistUiFlags =
    hasPlacementChanged || closesSettings || hasDensityChanged;
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
    closesSettings,
    committedGrouping,
    hasDensityChanged,
    nextStatePatch,
    persistRequest,
    separateUiFlags,
  };
};
