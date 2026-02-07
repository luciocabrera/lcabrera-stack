import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

import type { TableColumn } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';
import type { SortDirection } from '@/types/ui.types';

export type TableHeaderCellProps<TData> = ComponentPropsWithoutRef<'th'> &
  Pick<TableColumn<TData>, 'dataType' | 'label' | 'minWidth'> & {
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
    isSortable?: boolean;
    maxWidth?: number;
    onSettingsClick?: () => void;
    // onSort?: (params: HandleSortParams) => void;
    sortDirection?: SortDirection;
    sortIndex?: number;
    width?: number | string;
  };
