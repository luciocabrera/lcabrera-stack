import { use } from 'react';

import { GlobalSettingsProvider } from '#ui/contexts/GlobalSettingsContext';
import { GlobalSettingsContext } from '#ui/contexts/GlobalSettingsContext/GlobalSettingsContext.context';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { NotificationContext } from '#ui/contexts/NotificationContext/NotificationContext.context';

import type { TableOwnStackProps } from './TableOwnStack.types';

import { FiltersDataProvider } from './contexts/FiltersData';
import { TableConfigProvider } from './contexts/TableConfig';
import { TableOwnStackContext } from './contexts/TableConfig/TableOwnStackContext.context';
import { TablePersistenceContext } from './contexts/TableConfig/TablePersistenceContext.context';
import { TableFocusProvider } from './contexts/TableFocus';
import { toOwnStackMetaState } from './utils/toOwnStackMetaState.util';

export const TableOwnStack = <TData extends Record<string, unknown>>({
  children,
  columns,
  title,
}: TableOwnStackProps<TData>) => {
  const hasGlobalSettings = use(GlobalSettingsContext) !== undefined;
  const hasNotifications = use(NotificationContext) !== undefined;
  const ownStack = (
    <TablePersistenceContext value={undefined}>
      <TableConfigProvider<TData>
        columnsState={{ columns: [...columns] }}
        metaState={toOwnStackMetaState(title)}
      >
        <TableFocusProvider>
          <FiltersDataProvider<TData> columns={[...columns]}>
            <TableOwnStackContext value>{children}</TableOwnStackContext>
          </FiltersDataProvider>
        </TableFocusProvider>
      </TableConfigProvider>
    </TablePersistenceContext>
  );
  const withSettings = hasGlobalSettings ? (
    ownStack
  ) : (
    <GlobalSettingsProvider>{ownStack}</GlobalSettingsProvider>
  );

  return hasNotifications ? (
    withSettings
  ) : (
    <NotificationProvider>{withSettings}</NotificationProvider>
  );
};
