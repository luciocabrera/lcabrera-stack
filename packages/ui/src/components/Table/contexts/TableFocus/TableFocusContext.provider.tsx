import type { TableFocusState } from '#ui/components/Table/Table.types';

import { useStore } from '#ui/hooks';

import type {
  TableFocusContextValue,
  TableFocusProviderProps,
} from './TableFocusContext.types';

import { getInitialFocusState } from './focus/utils';
import { TableFocusContext } from './TableFocusContext.context';

/**
 * It is mounted above the Suspense boundary, beside the config context and for the same
 * reason grouping sits there (ADR-061): the data context is re-created on every
 * navigation, so focus placed there would be discarded by a revalidation the user did not
 * ask for.
 */
export const TableFocusProvider = ({ children }: TableFocusProviderProps) => {
  const focusStore = useStore<TableFocusState>(getInitialFocusState());

  const value: TableFocusContextValue = { focusStore };

  return <TableFocusContext value={value}>{children}</TableFocusContext>;
};
