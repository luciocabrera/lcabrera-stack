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
import { TableFocusProvider } from './contexts/TableFocus';
import { useTableDataState } from './hooks/useTableDataState.hook';
import { styles } from './Table.stylex';
import { TableContent } from './TableContent';
import { inferTableColumnsFromJson } from './utils/inferTableColumnsFromJson.util';

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
  const hasGlobalSettings = use(GlobalSettingsContext) !== undefined;
  const hasNotifications = use(NotificationContext) !== undefined;
  const { data, error, totalRows } = useTableDataState({
    columnsStore: config?.columnsStore,
    props,
  });

  if (config === undefined) {
    const ownColumns =
      columns ??
      (inferTableColumnsFromJson({
        rows: data,
      }) as readonly TableColumn<TData>[]);
    const ownStack = (
      <TableConfigProvider<TData>
        columnsState={{ columns: [...ownColumns] }}
        metaState={
          title === undefined
            ? {}
            : { title: { plural: title, singular: 'Row' } }
        }
      >
        <TableFocusProvider>
          <FiltersDataProvider<TData> columns={[...ownColumns]}>
            <Table<TData, TResponse> {...props} />
          </FiltersDataProvider>
        </TableFocusProvider>
      </TableConfigProvider>
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
  );

  return isFlexWrapperEnabled ? (
    <div {...stylex.props(styles.wrapper)}>{tableContent}</div>
  ) : (
    tableContent
  );
};
