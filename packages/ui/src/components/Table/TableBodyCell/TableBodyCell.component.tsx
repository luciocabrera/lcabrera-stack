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

/**
 * The role is declared rather than inherited: this cell is `display: flex`, and a browser
 * drops an element's implicit table role along with its table `display` (ADR-062).
 * Its `tabIndex` is the grid's roving tab stop — `0` on exactly one cell and `-1` on every
 * other — and the ref is how a focus request made while this row was unmounted reaches the
 * node once it exists.
 */
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
        hasCustomContent,
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
