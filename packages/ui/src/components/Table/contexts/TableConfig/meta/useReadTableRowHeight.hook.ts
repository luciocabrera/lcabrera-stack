import { use } from 'react';

import { TableDensityContext } from '#ui/components/Table/contexts/TableConfig/TableDensityContext.context';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { resolveTableDensity } from '#ui/components/Table/utils/resolveTableDensity.util';

export const useReadTableRowHeight = () => {
  const { metaStore } = useTableConfigContextValue();
  const defaults = use(TableDensityContext);

  return () =>
    resolveTableDensity({ defaults, state: metaStore.get() }).rowHeight;
};
