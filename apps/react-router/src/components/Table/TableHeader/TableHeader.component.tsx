import * as stylex from "@stylexjs/stylex";

import {
  useGetColumnGroups,
  useGetPinnedColumnOffsets,
} from "@/components/Table/contexts/TableConfig/columns/selectors";
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from "@/components/Table/contexts/TableData/data/selectors";

import { useRenderTracker } from "@/utils/performance";

import type { TableHeaderProps } from "./TableHeader.types.ts";

import { TableHeaderCell } from "../TableHeaderCell/index.ts";
import { TableRow } from "../TableRow/index.ts";
import { tableHeaderStyles } from "./TableHeader.stylex.ts";

export const TableHeader = <TData extends Record<string, unknown>, TResponse>({
  customStylex,
  ...rest
}: TableHeaderProps<TData, TResponse>) => {
  useRenderTracker({ componentName: "TableHeader" });

  const pinnedOffsets = useGetPinnedColumnOffsets();
  const { centerCols, leftPinnedCols, rightPinnedCols } = useGetColumnGroups();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const isLoadingState = isLoading || isLoadingMore;

  return (
    <thead
      data-testid="table-header"
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
            pinInfo={pinnedOffsets[col.key]}
          />
        ))}
        {centerCols.map((col) => (
          <TableHeaderCell
            columnKey={col.key}
            hasSettings={!col.isHeaderHidden}
            isLoadingState={isLoadingState}
            key={col.key}
            pinInfo={pinnedOffsets[col.key]}
          />
        ))}
        {rightPinnedCols.map((col) => (
          <TableHeaderCell
            columnKey={col.key}
            hasSettings={!col.isHeaderHidden}
            isLoadingState={isLoadingState}
            key={col.key}
            pinInfo={pinnedOffsets[col.key]}
          />
        ))}
      </TableRow>
    </thead>
  );
};
