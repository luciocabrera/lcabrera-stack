import * as stylex from '@stylexjs/stylex';

import type { TableBodyCellProps } from './TableBodyCell.types.ts';

import { skeletonStyles, tableBodyCellStyles } from './TableBodyCell.stylex.ts';
import { detectDataType, renderCellContent } from './utils/index.ts';

export const TableBodyCell = <TData extends Record<string, unknown>>({
  children,
  customStylex,
  dataType: dataTypeProp,
  format,
  isLoadingState = false,
  label,
  locale,
  minWidth,
  pinInfo,
  value,
  width,
  ...rest
}: TableBodyCellProps<TData>) => {
  const hasCustomContent = children !== undefined;
  const dataType = dataTypeProp ?? detectDataType(value);

  const isRightAligned =
    !hasCustomContent && (dataType === 'number' || dataType === 'currency');
  const isCentered =
    !hasCustomContent && (dataType === 'boolean' || dataType === 'date');
  const isBoolean = dataType === 'boolean';

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
      {...stylex.props(
        tableBodyCellStyles.base(minWidth, width),
        isRightAligned && tableBodyCellStyles.alignRight,
        isCentered && tableBodyCellStyles.alignCenter,
        pinInfo?.side === 'left' &&
          tableBodyCellStyles.pinnedLeft(pinInfo.offset),
        pinInfo?.side === 'right' &&
          tableBodyCellStyles.pinnedRight(pinInfo.offset),
        pinInfo?.isLastPinnedLeft && tableBodyCellStyles.pinnedShadowLeft,
        pinInfo?.isFirstPinnedRight && tableBodyCellStyles.pinnedShadowRight,
        customStylex,
      )}
    >
      {isLoadingState && (
        <div {...stylex.props(skeletonStyles.loadingOverlay)}>
          <div {...stylex.props(skeletonStyles.shimmerWave)} />
        </div>
      )}
      {hasCustomContent ? (
        content
      ) : (
        <span
          title={typeof content === 'string' ? content : undefined}
          {...stylex.props(
            tableBodyCellStyles.textContent,
            isBoolean && tableBodyCellStyles.booleanContent,
          )}
        >
          {content}
        </span>
      )}
    </td>
  );
};
