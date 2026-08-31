import * as stylex from '@stylexjs/stylex';

import type { TableProps } from './Table.types';

import { TableDataProvider } from './contexts';
import { styles } from './Table.stylex';
import { TableContent } from './TableContent';

export const Table = <TData extends Record<string, unknown>, TResponse>({
  actions,
  dataErrorSelector,
  dataSelector,
  dataTotalSelector,
  icon,
  isFlexWrapperEnabled = true,
  isLoading = false,
  onLoadMore,
  response,
}: TableProps<TData, TResponse>) => {
  const data = dataSelector ? dataSelector(response) : [];
  const totalRows = dataTotalSelector?.(response) ?? data.length;

  const tableContent = (
    <TableDataProvider<TData>
      dataState={{
        data,
        error: dataErrorSelector?.(response),
        isLoading,
        totalRows,
      }}
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
