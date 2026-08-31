import { useEffect, useRef } from 'react';

import { usePruneTableGroupExpansion } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';

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
