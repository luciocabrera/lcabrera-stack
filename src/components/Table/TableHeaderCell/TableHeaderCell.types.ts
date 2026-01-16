import type { ComponentPropsWithoutRef } from 'react';

import type { CustomStylex } from '@/types/design-system.types';

import type { ColumnFilter, TableColumn } from '../Table.types';
import type { HandleSortParams } from '../TableHeader';

export type OnResizeParams = {
  columnKey: string;
  width: number;
};

export type SortDirection = 'asc' | 'desc' | undefined;

export type TableHeaderCellProps = ComponentPropsWithoutRef<'th'> &
  Pick<TableColumn, 'dataType' | 'label' | 'minWidth'> & {
    columnKey: string;
    customStylex?: CustomStylex;
    fetchFilterOptions?: (
      offset?: number,
    ) => Promise<{ hasMore: boolean; values: string[] }>;
    filter?: ColumnFilter | null;
    /** Unique values for facet filter (select filter) */
    filterOptions?: string[];
    hasSettings?: boolean;
    isFilterable?: boolean;
    isLoading?: boolean;
    isSortable?: boolean;
    maxWidth?: number;
    onFilterApply?: (filter: ColumnFilter | null | undefined) => void;
    onFilterClear?: () => void;
    onResize?: (params: OnResizeParams) => void;
    onResizeDoubleClick?: (columnKey: string) => void;
    onSettingsClick?: () => void;
    onSort?: (params: HandleSortParams) => void;
    sortDirection?: SortDirection;
    sortIndex?: number;
    width?: number | string;
  };
