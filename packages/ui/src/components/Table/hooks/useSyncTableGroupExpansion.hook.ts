import { useEffect, useRef } from 'react';

import { usePruneTableGroupExpansion } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';

/**
 * Reconciles the collapsed paths against each new set of rows.
 *
 * Expansion outlives the data it was set on — it is held on the config context
 * precisely so a revalidation cannot wipe it (ADR-061) — which means something
 * has to notice when the rows it refers to are no longer there. This is that
 * something, and the data array's identity is the signal: `TableDataProvider`
 * writes a fresh one per navigation and per loaded page.
 *
 * The action is held in a ref so the effect depends on the rows alone. An
 * action closure is a new identity every render, and an effect that depended on
 * it would run on every render rather than on the one where the data changed.
 */
export const useSyncTableGroupExpansion = <
  TData extends Record<string, unknown> = Record<string, unknown>,
>() => {
  const data = useGetTableData<TData>();
  const pruneExpansion = usePruneTableGroupExpansion<TData>();
  const pruneExpansionRef = useRef(pruneExpansion);

  useEffect(() => {
    pruneExpansionRef.current = pruneExpansion;
  });

  useEffect(() => {
    pruneExpansionRef.current();
  }, [data]);
};
