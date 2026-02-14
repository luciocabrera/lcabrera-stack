import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

import type { DataKey } from '@/components/Table/Table.types';

export type TableHeaderCellProps<TData> = ComponentPropsWithoutRef<'th'> & {
  columnKey: DataKey<TData>;
  customStylex?: StyleXStyles;
  // fetchFilterOptions?: (
  //   offset?: number,
  // ) => Promise<{ hasMore: boolean; values: string[] }>;
  // filter?: ColumnFilter;
  /** Unique values for facet filter (select filter) */
  // filterOptions?: string[];
  hasSettings?: boolean;
  // isFilterable?: boolean;
  // isSortable?: boolean;
  // maxWidth?: number;
  onSettingsClick?: () => void;
  // onSort?: (params: HandleSortParams) => void;
  // sortDirection?: SortDirection;
  // sortIndex?: number;
  // width?: number | string;
};
