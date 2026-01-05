import type { ComponentPropsWithoutRef } from 'react';

import type { CustomStylex } from '@/types/design-system.types';

import type { TableColumn } from '../Table.types';
import type { HandleSortParams } from '../TableHeader';

export type OnResizeParams = {
  columnKey: string;
  width: number;
};

export type SortDirection = 'asc' | 'desc' | undefined;

export type TableHeaderCellProps = ComponentPropsWithoutRef<'th'> &
  Pick<TableColumn, 'label' | 'minWidth'> & {
    columnKey: string;
    customStylex?: CustomStylex;
    hasSettings?: boolean;
    isLoading?: boolean;
    isSortable?: boolean;
    maxWidth?: number;
    onResize?: (params: OnResizeParams) => void;
    onResizeDoubleClick?: (columnKey: string) => void;
    onSettingsClick?: () => void;
    onSort?: (params: HandleSortParams) => void;
    sortDirection?: SortDirection;
    sortIndex?: number;
    width?: number | string;
  };
