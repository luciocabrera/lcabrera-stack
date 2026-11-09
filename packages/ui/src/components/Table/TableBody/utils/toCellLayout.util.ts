import type { TableBodyCellLayout } from '#ui/components/Table/TableBodyCell/TableBodyCell.types';

export const toCellLayout = ({
  align,
  isFill,
  isNumeric,
  staticWidths,
}: TableBodyCellLayout) => ({ align, isFill, isNumeric, staticWidths });
