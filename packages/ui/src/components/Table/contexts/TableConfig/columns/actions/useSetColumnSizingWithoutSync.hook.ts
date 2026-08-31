import type { DataKey } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { writeColumnSizing } from './utils';

export type ColumnSizingArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly width: number | undefined;
};

export const useSetColumnSizingWithoutSync = <TData>() => {
  const { columnsStore } = useTableConfigContextValue<TData>();

  return ({ columnKey, width }: ColumnSizingArgs<TData>) => {
    writeColumnSizing<TData>({ columnKey, columnsStore, width });
  };
};
