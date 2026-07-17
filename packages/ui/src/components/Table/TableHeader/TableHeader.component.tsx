import { useGetPinnedColumnPartition } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '@repo/ui/components/Table/contexts/TableData/data/selectors';
import * as stylex from '@stylexjs/stylex';

import type { TableHeaderProps } from './TableHeader.types';

import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = <TData extends Record<string, unknown>, TResponse>({
  customStylex,
  ...rest
}: TableHeaderProps<TData, TResponse>) => {
  const { centerCols, leftPinnedCols, rightPinnedCols } =
    useGetPinnedColumnPartition();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const isLoadingState = isLoading || isLoadingMore;

  return (
    <thead
      data-testid='table-header'
      {...rest}
      {...stylex.props(tableHeaderStyles.container, customStylex)}
    >
      <TableRow isHeader>
        {leftPinnedCols.map((col) => (
          <TableHeaderCell
            columnKey={col.key}
            hasSettings={!col.isHeaderHidden}
            isLoadingState={isLoadingState}
            key={col.key}
          />
        ))}
        {centerCols.map((col) => (
          <TableHeaderCell
            columnKey={col.key}
            hasSettings={!col.isHeaderHidden}
            isLoadingState={isLoadingState}
            key={col.key}
          />
        ))}
        {rightPinnedCols.map((col) => (
          <TableHeaderCell
            columnKey={col.key}
            hasSettings={!col.isHeaderHidden}
            isLoadingState={isLoadingState}
            key={col.key}
          />
        ))}
      </TableRow>
    </thead>
  );
};
