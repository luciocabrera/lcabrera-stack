import * as stylex from '@stylexjs/stylex';

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
      {...getCellStyleProps({
        customStylex,
        minWidth,
        pinInfo,
        width,
        hasCustomContent,
        dataType,
      })}
    >
      {isLoadingState && (
        <div {...stylex.props(skeletonStyles.loadingOverlay)}>
          <div {...stylex.props(skeletonStyles.shimmerWave)} />
        </div>
      )}
      {renderDisplayedContent({ content, hasCustomContent, dataType })}
    </td>
  );
};
