import type { TablePersistenceEntry } from '#ui/components/Table/Table.types';

import { toUrlWriteOnly } from './toUrlWriteOnly.util';

type ResolvePersistenceEntriesArgs = {
  readonly entries: readonly TablePersistenceEntry[];
  readonly isColumnLayoutTransient?: boolean;
};

/** Which entries a table actually writes: a transient layout keeps only URL halves (ADR-094). */
export const resolvePersistenceEntries = ({
  entries,
  isColumnLayoutTransient = false,
}: ResolvePersistenceEntriesArgs): readonly TablePersistenceEntry[] =>
  isColumnLayoutTransient
    ? entries
        .filter(({ searchParamKey }) => searchParamKey !== undefined)
        .map((entry) => toUrlWriteOnly(entry))
    : entries;
