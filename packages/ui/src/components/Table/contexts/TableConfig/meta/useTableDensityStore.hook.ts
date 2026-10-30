import { use } from 'react';

import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';
import { TableDensityContext } from '#ui/components/Table/contexts/TableConfig/TableDensityContext.context';
import { resolveTableDensity } from '#ui/components/Table/utils/resolveTableDensity.util';

export const useTableDensityStore = <TSelected>(
  selector: (resolved: ReturnType<typeof resolveTableDensity>) => TSelected,
) => {
  const defaults = use(TableDensityContext);

  return useMetaStore((state) =>
    selector(resolveTableDensity({ defaults, state })),
  );
};
