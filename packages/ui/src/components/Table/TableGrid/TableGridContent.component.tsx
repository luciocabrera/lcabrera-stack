import * as stylex from '@stylexjs/stylex';

import type { TableGridContentProps } from './TableGrid.types';

import { TableCellRenderingProvider, TableDataProvider } from '../contexts';
import { TableOwnStackContext } from '../contexts/TableConfig/TableOwnStackContext.context';
import { styles } from '../Table.stylex';
import { TableContent } from '../TableContent';

export const TableGridContent = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  dataState,
  ...props
}: TableGridContentProps<TData, TResponse>) => {
  const {
    actions,
    cellPalette,
    cellRenderers,
    dataSelector,
    dataTotalSelector,
    icon,
    isFlexWrapperEnabled = true,
    onLoadMore,
  } = props;
  const tableContent = (
    <TableOwnStackContext value={false}>
      <TableCellRenderingProvider
        cellPalettes={[cellPalette]}
        cellRenderers={cellRenderers}
      >
        <TableDataProvider<TData> dataState={dataState}>
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
