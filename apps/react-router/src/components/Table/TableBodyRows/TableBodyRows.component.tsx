import {
  useGetColumnGroups,
  useGetColumnSizing,
  useGetPinnedColumnOffsets,
} from "@/components/Table/contexts/TableConfig/columns/selectors";
import { createRenderTableBodyCell } from "@/components/Table/TableBody/utils/createRenderTableBodyCell.util";
import { renderTableBodyColumnGroup } from "@/components/Table/TableBody/utils/renderTableBodyColumnGroup.util";
import { TableRow } from "@/components/Table/TableRow";
import { useRenderTracker } from "@/utils/performance";

import type { TableBodyRowsProps } from "./TableBodyRows.types.ts";

import { useGetTableData } from "../contexts/TableData/data/selectors/index.ts";

export const TableBodyRows = ({ endIndex, isLoadingState, startIndex }: TableBodyRowsProps) => {
  useRenderTracker({ componentName: "TableBodyRows" });

  const data = useGetTableData();
  const { centerCols, leftPinnedCols, rightPinnedCols } = useGetColumnGroups();
  const columnSizing = useGetColumnSizing();
  const pinnedOffsets = useGetPinnedColumnOffsets();

  const visibleRows = data.slice(startIndex, endIndex);

  const renderBodyCell = createRenderTableBodyCell({
    columnSizing,
    isLoadingState,
    pinnedOffsets,
  });

  return (
    <>
      {visibleRows.map((row, index) => {
        const rowIndex = startIndex + index;
        const rowData = row as Record<string, unknown>;

        return (
          <TableRow key={rowIndex}>
            {renderTableBodyColumnGroup({
              columns: leftPinnedCols,
              renderCell: renderBodyCell,
              rowData,
            })}
            {renderTableBodyColumnGroup({
              columns: centerCols,
              renderCell: renderBodyCell,
              rowData,
            })}
            {renderTableBodyColumnGroup({
              columns: rightPinnedCols,
              renderCell: renderBodyCell,
              rowData,
            })}
          </TableRow>
        );
      })}
    </>
  );
};
