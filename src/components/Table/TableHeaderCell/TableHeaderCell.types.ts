import type { ComponentPropsWithoutRef } from 'react';

import type { CustomStylex } from '@/types/design-system.types';

import type { TableColumn } from '../Table.types';

export type SortDirection = 'asc' | 'desc' | undefined;

export type TableHeaderCellProps = ComponentPropsWithoutRef<'th'> &
  Pick<TableColumn, 'label' | 'minWidth'> & {
    columnKey: string;
    customStylex?: CustomStylex;
    hasSettings?: boolean;
    isLoading?: boolean;
    isSortable?: boolean;
    maxWidth?: number;
    onResize?: (columnKey: string, width: number) => void;
    onResizeDoubleClick?: (columnKey: string) => void;
    onSettingsClick?: () => void;
    onSort?: (direction: SortDirection) => void;
    sortDirection?: SortDirection;
    width?: number | string;
  };
