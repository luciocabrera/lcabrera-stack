import type { ComponentPropsWithoutRef } from 'react';

import type { TableCustomStylex } from '../TableBase/TableBase.types';

export type SortDirection = 'asc' | 'desc' | undefined;

export type TableHeaderCellProps = ComponentPropsWithoutRef<'th'> & {
  customStylex?: TableCustomStylex;
  hasSettings?: boolean;
  isSortable?: boolean;
  isSticky?: boolean;
  label: string;
  minWidth?: number | string;
  onSettingsClick?: () => void;
  onSort?: (direction: SortDirection) => void;
  sortDirection?: SortDirection;
  width?: number | string;
};
