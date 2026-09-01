import * as stylex from '@stylexjs/stylex';

import { useTableCellFocus } from '#ui/components/Table/hooks';

import type { TableBodyCellProps } from './TableBodyCell.types';

import { skeletonStyles } from './TableBodyCell.stylex';
import {
  detectDataType,
  getCellStyleProps,
  renderCellContent,
  renderDisplayedContent,
} from './utils';

export const TableBodyCell = <TData extends Record<string, unknown>>({
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
  const { cellRef, onFocus, tabIndex } = useTableCellFocus({
    columnKey,
    rowIndex,
    rowKey,
  });

  const content = hasCustomContent
    ? children
    : renderCellContent({
        dataType,
        format,
        label,
        locale,
        value,
      });

  return (
    <td
      {...rest}
      onFocus={onFocus}
      ref={cellRef}
      role='gridcell'
      tabIndex={tabIndex}
      {...getCellStyleProps({
        customStylex,
        dataType,
        isAlignedByDataType,
        minWidth,
        pinInfo,
        width,
      })}
    >
      {Boolean(isLoadingState) && (
        <div {...stylex.props(skeletonStyles.loadingOverlay)}>
          <div {...stylex.props(skeletonStyles.shimmerWave)} />
        </div>
      )}
      {renderDisplayedContent({ content, dataType, hasCustomContent })}
    </td>
  );
};
