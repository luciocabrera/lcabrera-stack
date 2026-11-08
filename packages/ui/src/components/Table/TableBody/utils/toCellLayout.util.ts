import type { TableBodyCellLayout } from '#ui/components/Table/TableBodyCell/TableBodyCell.types';

export const toCellLayout = ({
  align,
  isFill,
  staticWidths,
}: TableBodyCellLayout) => ({ align, isFill, staticWidths });
