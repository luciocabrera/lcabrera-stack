import type { ComponentPropsWithoutRef } from 'react';

import type { CustomStylex } from '@/design-system/common.types';

export type SortDirection = 'asc' | 'desc' | undefined;

export type TableHeaderCellProps = ComponentPropsWithoutRef<'th'> & {
  customStylex?: CustomStylex;
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
