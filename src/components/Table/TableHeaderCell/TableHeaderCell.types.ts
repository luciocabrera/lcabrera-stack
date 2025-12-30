import type { ComponentPropsWithoutRef } from 'react';

import type { CustomStylex } from '@/types/design-system.types';

import type { TableColumn } from '../Table.types';

export type SortDirection = 'asc' | 'desc' | undefined;

export type TableHeaderCellProps = ComponentPropsWithoutRef<'th'> &
  Pick<TableColumn, 'label' | 'minWidth'> & {
    customStylex?: CustomStylex;
    hasSettings?: boolean;
    isSortable?: boolean;
    isSticky?: boolean;
    onSettingsClick?: () => void;
    onSort?: (direction: SortDirection) => void;
    sortDirection?: SortDirection;
    width?: number | string;
  };
