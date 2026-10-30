import * as stylex from '@stylexjs/stylex';

import type { TableGridContentProps } from './TableGrid.types';

import { TableCellRenderingProvider, TableDataProvider } from '../contexts';
import { TableDensityContext } from '../contexts/TableConfig/TableDensityContext.context';
import { TableOwnStackContext } from '../contexts/TableConfig/TableOwnStackContext.context';
import { TablePresentationContext } from '../contexts/TableConfig/TablePresentationContext.context';
import { styles } from '../Table.stylex';
import { TableContent } from '../TableContent';
import { TableStaticContent } from '../TableStaticContent/TableStaticContent.component';
import { resolveTablePresentation } from '../utils/resolveTablePresentation.util';
import { splitTableProps } from '../utils/splitTableProps.util';

export const TableGridContent = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  dataState,
  ...props
}: TableGridContentProps<TData, TResponse>) => {
  const { own, tableProps } = splitTableProps(props);
  const {
    actions,
    caption,
    cellPalette,
    cellRenderers,
    customStylex,
    dataSelector,
    dataTotalSelector,
    density,
    features,
    footer,
    headerDensity,
    icon,
    layout,
    onLoadMore,
  } = own;
  const presentation = resolveTablePresentation({ features, layout });
  const isStatic = presentation.layout === 'static';
  const { isFlexWrapperEnabled = !isStatic } = own;
  const contentProps = {
    actions,
    caption,
    customStylex,
    footer,
    icon,
    tableProps,
  };
  const tableContent = (
    <TableOwnStackContext value={false}>
      <TableCellRenderingProvider
        cellPalettes={[cellPalette]}
        cellRenderers={cellRenderers}
      >
        <TableDataProvider<TData> dataState={dataState}>
          <TableDensityContext value={{ density, headerDensity }}>
            <TablePresentationContext value={presentation}>
              {isStatic ? (
                <TableStaticContent<TData, TResponse> {...contentProps} />
              ) : (
                <TableContent
                  {...contentProps}
                  dataSelector={dataSelector}
                  dataTotalSelector={dataTotalSelector}
                  onLoadMore={onLoadMore}
                />
              )}
            </TablePresentationContext>
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
