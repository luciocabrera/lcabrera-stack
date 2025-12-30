import type { ComponentPropsWithRef } from 'react';

import type { CustomStylex } from '@/types/design-system.types';

export type TableColumn = {
  dataType?: TableColumnDataType;
  key: string;
  label: string;
  minWidth?: number;
};

export type TableColumnDataType =
  | 'boolean'
  | 'currency'
  | 'date'
  | 'number'
  | 'string';

export type TableDensity = 'comfortable' | 'compact';

export type TableProps<TData extends Record<string, unknown>> = BaseProps & {
  columns: TableColumn[];
  data: TData[];
  overscan?: number;
  rowHeight?: number;
  useFlexWrapper?: boolean;
};

type BaseProps = ComponentPropsWithRef<'table'> & {
  customStylex?: CustomStylex;
  density?: TableDensity;
  isBordered?: boolean;
  isStriped?: boolean;
};
