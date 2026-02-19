import * as stylex from '@stylexjs/stylex';

import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '@/components/Table/contexts/TableData/data/selectors';

import type { TableBodyCellProps } from './TableBodyCell.types';

import { skelletonStyles, tableBodyCellStyles } from './TableBodyCell.stylex';
import { detectDataType, renderCellContent } from './utils';

export const TableBodyCell = <TData extends Record<string, unknown>>({
  customStylex,
  dataType: dataTypeProp,
  format,
  label,
  locale,
  minWidth,
  value,
  width,
  ...rest
}: TableBodyCellProps<TData>) => {
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const dataType = dataTypeProp ?? detectDataType(value);

  const isLoadingState = isLoading || isLoadingMore;
  const isRightAligned = dataType === 'number' || dataType === 'currency';
  const isCentered = dataType === 'boolean' || dataType === 'date';
  const isBoolean = dataType === 'boolean';

  const content = renderCellContent({
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
        customStylex,
      )}
    >
      <span
        title={typeof content === 'string' ? content : undefined}
        {...stylex.props(
          tableBodyCellStyles.textContent,
          isBoolean && tableBodyCellStyles.booleanContent,
        )}
      >
        {content}
      </span>
      {isLoadingState && (
        <div {...stylex.props(skelletonStyles.loadingOverlay)}>
          <div {...stylex.props(skelletonStyles.shimmerWave)} />
        </div>
      )}
    </td>
  );
};
