import * as stylex from '@stylexjs/stylex';

import { useRenderTracker } from '@/utils/performance';

import type { TableProps } from './Table.types';

import { TableDataProvider } from './contexts';
import { useGetTablePersistenceKey } from './contexts/TableConfig/meta/selectors';
import { styles } from './Table.stylex';
import { TableContent } from './TableContent';

export const Table = <TData extends Record<string, unknown>, TResponse>({
  actions,
  dataSelector,
  dataTotalSelector,
  icon,
  isFlexWrapperEnabled = true,
  isLoading = false,
  onLoadMore,
  response,
}: TableProps<TData, TResponse>) => {
  useRenderTracker({ componentName: 'Table' });
  const persistenceKey = useGetTablePersistenceKey();
  const data = dataSelector ? dataSelector(response) : [];
  const totalRows = dataTotalSelector
    ? dataTotalSelector(response)
    : data.length;

  const tableContent = (
    <TableDataProvider<TData>
      dataState={{
        data,
        isLoading,
        totalRows,
      }}
      isPersistenceEnabled={!isLoading}
      persistenceKey={persistenceKey}
    >
      <TableContent
        actions={actions}
        dataSelector={dataSelector}
        dataTotalSelector={dataTotalSelector}
        icon={icon}
        onLoadMore={onLoadMore}
      />
    </TableDataProvider>
  );

  if (isFlexWrapperEnabled)
    return <div {...stylex.props(styles.wrapper)}>{tableContent}</div>;

  return tableContent;
};
