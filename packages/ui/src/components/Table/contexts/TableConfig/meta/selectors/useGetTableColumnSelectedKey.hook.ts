import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

import type { DataKey } from '@/components/Table/Table.types';

export const useGetTableColumnSelectedKey = <
  TData extends Record<string, unknown>,
>() => useMetaStore((state) => state.columnSelectedKey as DataKey<TData>);
