import * as stylex from '@stylexjs/stylex';
import { use } from 'react';

import { GlobalSettingsProvider } from '#ui/contexts/GlobalSettingsContext';
import { GlobalSettingsContext } from '#ui/contexts/GlobalSettingsContext/GlobalSettingsContext.context';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { NotificationContext } from '#ui/contexts/NotificationContext/NotificationContext.context';

import type { TableConfigContextValue } from './contexts/TableConfig/TableConfigContext.types';
import type { TableColumn, TableProps } from './Table.types';

import { TableCellRenderingProvider, TableDataProvider } from './contexts';
import { FiltersDataProvider } from './contexts/FiltersData';
import { TableConfigProvider } from './contexts/TableConfig';
import { TableConfigContext } from './contexts/TableConfig/TableConfigContext.context';
import { TableOwnStackContext } from './contexts/TableConfig/TableOwnStackContext.context';
import { TablePersistenceContext } from './contexts/TableConfig/TablePersistenceContext.context';
import { TableFocusProvider } from './contexts/TableFocus';
import { useTableDataState } from './hooks/useTableDataState.hook';
import { styles } from './Table.stylex';
import { TableContent } from './TableContent';
import { inferTableColumnsFromJson } from './utils/inferTableColumnsFromJson.util';
import { needsOwnTableStack } from './utils/needsOwnTableStack.util';
import { toOwnStackMetaState } from './utils/toOwnStackMetaState.util';

export const Table = <TData extends Record<string, unknown>, TResponse>(
  props: TableProps<TData, TResponse>,
) => {
  const {
    actions,
    cellPalette,
    cellRenderers,
    columns,
    dataSelector,
    dataTotalSelector,
    icon,
    isFlexWrapperEnabled = true,
    isLoading = false,
    onLoadMore,
    title,
  } = props;
  const config = use(TableConfigContext) as
    | TableConfigContextValue<TData>
    | undefined;
  const isInOwnStack = use(TableOwnStackContext);
  const hasGlobalSettings = use(GlobalSettingsContext) !== undefined;
  const hasNotifications = use(NotificationContext) !== undefined;
  const isNeedsOwnStack = needsOwnTableStack({
    hasConfig: config !== undefined,
    hasRows: props.rows !== undefined,
    isInOwnStack,
  });
  const { data, error, totalRows } = useTableDataState({
    columnsStore: isNeedsOwnStack ? undefined : config?.columnsStore,
    props,
  });

  if (isNeedsOwnStack) {
    const ownColumns =
      columns ??
      (inferTableColumnsFromJson({
        rows: data,
      }) as readonly TableColumn<TData>[]);
    const ownStack = (
      <TablePersistenceContext value={undefined}>
        <TableConfigProvider<TData>
          columnsState={{ columns: [...ownColumns] }}
          metaState={toOwnStackMetaState(title)}
        >
          <TableFocusProvider>
            <FiltersDataProvider<TData> columns={[...ownColumns]}>
              <TableOwnStackContext value>
                <Table<TData, TResponse> {...props} />
              </TableOwnStackContext>
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
  }

  const tableContent = (
    <TableOwnStackContext value={false}>
      <TableCellRenderingProvider
        cellPalettes={[cellPalette]}
        cellRenderers={cellRenderers}
      >
        <TableDataProvider<TData>
          dataState={{ data, error, isLoading, totalRows }}
        >
          <TableContent
            actions={actions}
            dataSelector={dataSelector}
            dataTotalSelector={dataTotalSelector}
            icon={icon}
            onLoadMore={onLoadMore}
          />
        </TableDataProvider>
      </TableCellRenderingProvider>
    </TableOwnStackContext>
  );

  return isFlexWrapperEnabled ? (
    <div {...stylex.props(styles.wrapper)}>{tableContent}</div>
  ) : (
    tableContent
  );
};
