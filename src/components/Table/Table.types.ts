import type { ComponentPropsWithRef } from 'react';

import type { CustomStylex } from '@/types/design-system.types';
import type {
  CurrencyFormatOptions,
  DateFormatOptions,
  NumberFormatOptions,
} from '@/utils/formatters';

/**
 * Column sizing state - maps column key to custom width
 */
export type ColumnSizingState = Record<string, number>;

export type TableColumn = {
  dataType?: TableColumnDataType;
  /** Format options for the column based on data type */
  format?: TableColumnFormat;
  key: string;
  label: string;
  maxWidth?: number;
  minWidth?: number;
};

/**
 * Default minimum column width when not specified
 */
export const DEFAULT_MIN_COLUMN_WIDTH = 60;

/**
 * Default maximum column width when not specified
 */
export const DEFAULT_MAX_COLUMN_WIDTH = 600;

export type TableColumnDataType =
  | 'boolean'
  | 'currency'
  | 'date'
  | 'number'
  | 'string';

/**
 * Format options for a column based on its data type
 */
export type TableColumnFormat = {
  /** Currency formatting options (for dataType: 'currency') */
  currency?: CurrencyFormatOptions;
  /** Date formatting options (for dataType: 'date') */
  date?: DateFormatOptions;
  /** Number formatting options (for dataType: 'number') */
  number?: NumberFormatOptions;
};

export type TableDensity = 'comfortable' | 'compact';

export type TableProps<TData extends Record<string, unknown>> = BaseProps & {
  columns: TableColumn[];
  data: TData[];
  isFlexWrapperEnabled?: boolean;
  /** Show loading skeleton overlay */
  isLoading?: boolean;
  /** Locale for formatting (defaults to navigator.language) */
  locale?: string;
  overscan?: number;
  /** Persistence key for storing table state (e.g., column widths) */
  persistenceKey?: string;
  rowHeight?: number;
};

type BaseProps = ComponentPropsWithRef<'table'> & {
  customStylex?: CustomStylex;
  density?: TableDensity;
  isBordered?: boolean;
  isStriped?: boolean;
};
