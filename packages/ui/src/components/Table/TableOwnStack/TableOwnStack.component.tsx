import type { TableOwnStackProps } from './TableOwnStack.types';

import { TableConfigProvider } from '../contexts/TableConfig';
import { TableOwnStackContext } from '../contexts/TableConfig/TableOwnStackContext.context';
import { TablePersistenceContext } from '../contexts/TableConfig/TablePersistenceContext.context';
import { TableFocusProvider } from '../contexts/TableFocus';
import { toOwnStackMetaState } from '../utils/toOwnStackMetaState.util';
import { TableOwnStackChromeProviders } from './TableOwnStackChromeProviders.component';

export const TableOwnStack = <TData extends Record<string, unknown>>({
  children,
  columns,
  hasChrome,
  title,
}: TableOwnStackProps<TData>) => {
  const marked = <TableOwnStackContext value>{children}</TableOwnStackContext>;

  return (
    <TablePersistenceContext value={undefined}>
      <TableConfigProvider<TData>
        columnsState={{ columns: [...columns] }}
        metaState={toOwnStackMetaState(title)}
      >
        <TableFocusProvider>
          {hasChrome ? (
            <TableOwnStackChromeProviders<TData> columns={columns}>
              {marked}
            </TableOwnStackChromeProviders>
          ) : (
            marked
          )}
        </TableFocusProvider>
      </TableConfigProvider>
    </TablePersistenceContext>
  );
};
