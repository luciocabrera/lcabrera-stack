import type {
  TablePersistenceEntry,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { TABLE_TOTALS_PLACEMENT_PARAM } from '#ui/components/Table/Table.constants';

type AppendQueryPersistenceEntriesArgs = {
  readonly columnEntries: readonly TablePersistenceEntry[];
  readonly groupingUpdate: GroupingPersistenceUpdate;
  readonly hasPlacementChanged: boolean;
  readonly totalsPlacement: TableTotalsPlacement;
};

type GroupingPersistenceUpdate =
  | { readonly kind: 'unchanged' }
  | {
      readonly kind: 'updated';
      readonly persistenceEntry: TablePersistenceEntry;
    };

export const appendQueryPersistenceEntries = ({
  columnEntries,
  groupingUpdate,
  hasPlacementChanged,
  totalsPlacement,
}: AppendQueryPersistenceEntriesArgs) => {
  const groupingEntries =
    groupingUpdate.kind === 'updated' ? [groupingUpdate.persistenceEntry] : [];
  const placementEntries = hasPlacementChanged
    ? [
        {
          searchParamKey: TABLE_TOTALS_PLACEMENT_PARAM,
          searchParamValue: totalsPlacement,
        },
      ]
    : [];

  return [...columnEntries, ...groupingEntries, ...placementEntries];
};
