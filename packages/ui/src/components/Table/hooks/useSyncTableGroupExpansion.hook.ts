import { useEffect, useRef } from 'react';

import { usePruneTableGroupExpansion } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';

/**
 * Expansion outlives the data it was set on — it is held on the config context precisely
 * so a revalidation cannot wipe it (ADR-061) — which means something has to notice when
 * the rows it refers to are no longer there.
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
