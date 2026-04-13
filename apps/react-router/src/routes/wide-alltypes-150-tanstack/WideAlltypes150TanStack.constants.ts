import type { ColumnDef } from '@tanstack/react-table';

import type { WideAlltypes150 } from '@/services';

import { COLUMNS } from '../wide-alltypes-150/WideAlltypes150.constants.ts';

export const ESTIMATED_ROW_HEIGHT = 38;
export const FETCH_SIZE = 50;
export const ROW_OVERSCAN = 8;
export const SCROLL_FETCH_THRESHOLD = 500;

const formatCellValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }

  return '—';
};

const buildColumnDefinition = ({
  isSortable,
  key,
  label,
  minWidth,
}: (typeof COLUMNS)[number]): ColumnDef<WideAlltypes150> => ({
  accessorKey: key,
  cell: ({ getValue }) => formatCellValue(getValue()),
  enableSorting: isSortable ?? true,
  header: label,
  size: minWidth,
});

export const COLUMN_DEFINITIONS: readonly ColumnDef<WideAlltypes150>[] =
  COLUMNS.map((columnDefinition) => buildColumnDefinition(columnDefinition));
