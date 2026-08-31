import type { TablePersistenceEntry } from '#ui/components/Table/Table.types';

import { toUrlWriteOnly } from './toUrlWriteOnly.util';

type ResolvePersistenceEntriesArgs = {
  readonly entries: readonly TablePersistenceEntry[];
  readonly isColumnLayoutTransient?: boolean;
};

export const resolvePersistenceEntries = ({
  entries,
  isColumnLayoutTransient = false,
}: ResolvePersistenceEntriesArgs): readonly TablePersistenceEntry[] =>
  isColumnLayoutTransient
    ? entries
        .filter(({ searchParamKey }) => searchParamKey !== undefined)
        .map((entry) => toUrlWriteOnly(entry))
    : entries;
