import type { TableFocusState } from '#ui/components/Table/Table.types';

import { useStore } from '#ui/hooks';

import type {
  TableFocusContextValue,
  TableFocusProviderProps,
} from './TableFocusContext.types';

import { getInitialFocusState } from './focus/utils';
import { TableFocusContext } from './TableFocusContext.context';

export const TableFocusProvider = ({ children }: TableFocusProviderProps) => {
  const focusStore = useStore<TableFocusState>(getInitialFocusState());

  const value: TableFocusContextValue = { focusStore };

  return <TableFocusContext value={value}>{children}</TableFocusContext>;
};
