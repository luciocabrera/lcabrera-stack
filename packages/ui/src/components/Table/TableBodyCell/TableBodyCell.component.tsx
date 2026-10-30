import * as stylex from '@stylexjs/stylex';
import { use } from 'react';

import { TablePresentationContext } from '#ui/components/Table/contexts/TableConfig/TablePresentationContext.context';
import { useTableCellFocus } from '#ui/components/Table/hooks';
import { skeleton } from '#ui/design-system/tokens/commons.stylex';

import type { TableBodyCellProps } from './TableBodyCell.types';

import {
  detectDataType,
  getCellStyleProps,
  renderCellContent,
  renderDisplayedContent,
} from './utils';

export const TableBodyCell = <TData extends Record<string, unknown>>({
  align,
  children,
  columnKey,
  customStylex,
  dataType: dataTypeProp,
  format,
  isFill,
  isLoadingState = false,
  label,
  locale,
  minWidth,
  pinInfo,
  rowIndex,
  rowKey,
  staticWidths,
  value,
  width,
  ...rest
}: TableBodyCellProps<TData>) => {
  const isStatic = use(TablePresentationContext).layout === 'static';
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
      data-column-key={String(columnKey)}
      data-testid='table-body-cell'
      {...rest}
      onFocus={isStatic ? undefined : onFocus}
      ref={cellRef}
      role={isStatic ? undefined : 'gridcell'}
      tabIndex={isStatic ? undefined : tabIndex}
      {...getCellStyleProps({
        align,
        customStylex,
        dataType,
        isAlignedByDataType,
        isFill,
        minWidth,
        pinInfo,
        staticWidths,
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
