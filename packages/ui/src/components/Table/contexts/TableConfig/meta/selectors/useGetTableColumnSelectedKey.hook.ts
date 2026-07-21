import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';

import { useMetaStore } from '@lcabrera/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableColumnSelectedKey = <
  TData extends Record<string, unknown>,
>() => useMetaStore((state) => state.columnSelectedKey as DataKey<TData>);
