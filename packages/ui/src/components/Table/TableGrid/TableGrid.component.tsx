import * as stylex from '@stylexjs/stylex';

import type { TableGridProps } from './TableGrid.types';

import { TableCellRenderingProvider, TableDataProvider } from '../contexts';
import { TableOwnStackContext } from '../contexts/TableConfig/TableOwnStackContext.context';
import { useTableDataState } from '../hooks/useTableDataState.hook';
import { styles } from '../Table.stylex';
import { TableContent } from '../TableContent';

export const TableGrid = <TData extends Record<string, unknown>, TResponse>(
  props: TableGridProps<TData, TResponse>,
) => {
  const {
    actions,
    cellPalette,
    cellRenderers,
    dataSelector,
    dataTotalSelector,
    icon,
    isFlexWrapperEnabled = true,
    isLoading = false,
    onLoadMore,
  } = props;
  const { data, error, totalRows } = useTableDataState(props);
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
