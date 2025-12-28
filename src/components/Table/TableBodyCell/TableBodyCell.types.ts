import type { ComponentPropsWithoutRef } from 'react';

import type { CustomStylex } from '@/design-system/common.types';

export type TableBodyCellDataType =
  | 'boolean'
  | 'currency'
  | 'date'
  | 'number'
  | 'string';

export type TableBodyCellProps = ComponentPropsWithoutRef<'td'> & {
  columnLabel?: string;
  customStylex?: CustomStylex;
  dataType?: TableBodyCellDataType;
  minWidth?: number | string;
  value: unknown;
  width?: number | string;
};
