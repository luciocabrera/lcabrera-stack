import * as stylex from '@stylexjs/stylex';

import type { TableGridContentProps } from './TableGrid.types';

import { TableCellRenderingProvider, TableDataProvider } from '../contexts';
import { TableDensityContext } from '../contexts/TableConfig/TableDensityContext.context';
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
    density,
    headerDensity,
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
          <TableDensityContext value={{ density, headerDensity }}>
            <TableContent
              actions={actions}
              dataSelector={dataSelector}
              dataTotalSelector={dataTotalSelector}
              icon={icon}
              onLoadMore={onLoadMore}
            />
          </TableDensityContext>
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
