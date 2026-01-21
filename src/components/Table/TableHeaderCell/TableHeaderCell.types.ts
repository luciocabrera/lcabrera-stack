import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

import type { ColumnFilter, SortDirection, TableColumn } from '../Table.types';
import type { HandleSortParams } from '../TableHeader/TableHeader.types';

export type OnResizeParams = {
  columnKey: string;
  width: number;
};

export type TableHeaderCellProps = ComponentPropsWithoutRef<'th'> &
  Pick<TableColumn, 'dataType' | 'label' | 'minWidth'> & {
    columnKey: string;
    customStylex?: StyleXStyles;
    fetchFilterOptions?: (
      offset?: number,
    ) => Promise<{ hasMore: boolean; values: string[] }>;
    filter?: ColumnFilter;
    /** Unique values for facet filter (select filter) */
    filterOptions?: string[];
    hasSettings?: boolean;
    isFilterable?: boolean;
    isLoading?: boolean;
    isSortable?: boolean;
    maxWidth?: number;
    onFilterApply: (filter?: ColumnFilter) => void;
    onFilterClear: () => void;
    onResize?: (params: OnResizeParams) => void;
    onResizeDoubleClick?: (columnKey: string) => void;
    onSettingsClick?: () => void;
    onSort?: (params: HandleSortParams) => void;
    sortDirection?: SortDirection;
    sortIndex?: number;
    width?: number | string;
  };
