import * as stylex from '@stylexjs/stylex';

import { skeleton } from '#ui/design-system/tokens/commons.stylex';

import type { TableBodyCellProps } from './TableBodyCell.types';

import { useTableBodyCellSemantics } from './useTableBodyCellSemantics.hook';
import {
  detectDataType,
  getCellStyleProps,
  renderDisplayedContent,
  resolveCellContent,
} from './utils';

export const TableBodyCell = <TData extends Record<string, unknown>>({
  cellLayout,
  children,
  columnKey,
  customStylex,
  dataType: dataTypeProp,
  format,
  isLoadingState = false,
  label,
  locale,
  minWidth,
  pinInfo,
  rowIndex,
  rowKey,
  value,
  width,
  ...rest
}: TableBodyCellProps<TData>) => {
  const hasCustomContent = children !== undefined;
  const dataType = dataTypeProp ?? detectDataType(value);
  const isAlignedByDataType = !hasCustomContent || dataTypeProp !== undefined;
  const { cellProps, cellRef } = useTableBodyCellSemantics({
    columnKey,
    rowIndex,
    rowKey,
  });

  const content = resolveCellContent({
    children,
    dataType,
    format,
    label,
    locale,
    value,
  });

  return (
    <td
      data-column-key={String(columnKey)}
      data-testid='table-body-cell'
      {...rest}
      {...cellProps}
      ref={cellRef}
      {...getCellStyleProps({
        ...cellLayout,
        customStylex,
        dataType,
        isAlignedByDataType,
        minWidth,
        pinInfo,
        width,
      })}
    >
      {Boolean(isLoadingState) && (
        <div {...stylex.props(skeleton.loadingOverlay)}>
          <div {...stylex.props(skeleton.shimmerWave)} />
        </div>
      )}
      {renderDisplayedContent({ content, dataType, hasCustomContent })}
    </td>
  );
};
