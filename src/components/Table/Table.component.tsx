import * as stylex from '@stylexjs/stylex';

import { useRenderTracker } from '@/utils/performance';

import type { TableProps } from './Table.types';

import { TableDataProvider } from './contexts';
import { styles } from './Table.stylex';
import { TableContent } from './TableContent';

export const Table = <TData extends Record<string, unknown>, TResponse>({
  actions,
  dataSelector,
  dataTotalSelector,
  icon,
  isFlexWrapperEnabled = true,
  onLoadMore,
  response,
}: TableProps<TData, TResponse>) => {
  useRenderTracker({ componentName: 'Table' });
  const data = dataSelector
    ? dataSelector(response)
    : ([] as unknown as TData[]);
  const totalRows = dataTotalSelector
    ? dataTotalSelector(response)
    : data.length;

  const tableContent = (
    <TableDataProvider<TData>
      dataState={{
        data,
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
