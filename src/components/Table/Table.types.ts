import type { ComponentPropsWithRef } from 'react';

import type { CustomStylex } from '@/design-system/common.types';

export type TableColumn = {
  dataType?: 'boolean' | 'currency' | 'date' | 'number' | 'string';
  key: string;
  label: string;
  minWidth?: number;
};

export type TableDensity = 'comfortable' | 'compact';

 export type TableProps<TData extends Record<string, unknown>> = BaseProps & {
  columns: TableColumn[];
  data: TData[];
  height?: number;
  overscan?: number;
  rowHeight?: number;
};

type BaseProps = ComponentPropsWithRef<'table'> & {
  customStylex?: CustomStylex;
  density?: TableDensity;
  isBordered?: boolean;
  isStriped?: boolean;
};
