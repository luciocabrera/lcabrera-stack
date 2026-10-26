import { useSyncExternalStore } from 'react';

import type {
  TableColumnsState,
  TableProps,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { deriveLocalRows } from '#ui/components/Table/utils/deriveLocalRows.util';
import { selectTableResponse } from '#ui/components/Table/utils/selectTableResponse.util';

type UseTableDataStateArgs<TData extends Record<string, unknown>, TResponse> = {
  readonly columnsStore: TStore<TableColumnsState<TData>> | undefined;
  readonly props: TableProps<TData, TResponse>;
};

const unsubscribeFromNothing = () => undefined;

const subscribeToNothing = () => unsubscribeFromNothing;

export const useTableDataState = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  columnsStore,
  props,
}: UseTableDataStateArgs<TData, TResponse>) => {
  const subscribe = columnsStore?.subscribe ?? subscribeToNothing;
  const sorting = useSyncExternalStore(
    subscribe,
    () => columnsStore?.get().sorting,
    () => columnsStore?.getServerSnapshot().sorting,
  );
  const columnFilters = useSyncExternalStore(
    subscribe,
    () => columnsStore?.get().columnFilters,
    () => columnsStore?.getServerSnapshot().columnFilters,
  );

  if (props.rows === undefined) {
    return selectTableResponse(props);
  }

  const data =
    sorting === undefined || columnFilters === undefined
      ? props.rows
      : deriveLocalRows({ columnFilters, rows: props.rows, sorting });

  return { data, error: undefined, totalRows: data.length };
};
