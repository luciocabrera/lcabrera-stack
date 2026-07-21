import { useTableConfigContextValue } from '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStore } from '@lcabrera/ui/hooks';

import type {
  ColumnDrawerProviderProps,
  ColumnDrawerState,
} from './ColumnDrawerContext.types';

import { useGetTableColumnSelectedKey } from '../../contexts/TableConfig/meta/selectors';
import { ColumnDrawerContext } from './ColumnDrawerContext.context';
import { getTableColumnDrawerState } from './utils';

export const ColumnDrawerProvider = ({
  children,
}: ColumnDrawerProviderProps) => {
  const { columnsStore } = useTableConfigContextValue();
  const columnKey = useGetTableColumnSelectedKey();
  const columnsState = columnsStore.get();
  const initialState: ColumnDrawerState<Record<string, unknown>> =
    getTableColumnDrawerState({
      columnKey: columnKey ?? '',
      columnsState,
    });

  const columnStore =
    useStore<ColumnDrawerState<Record<string, unknown>>>(initialState);

  return (
    <ColumnDrawerContext value={{ columnStore }}>
      {children}
    </ColumnDrawerContext>
  );
};
