import type { ComponentPropsWithoutRef } from 'react';

import type { TableCustomStylex } from '../TableBase/TableBase.types';

export type TableBodyCellDataType =
  | 'boolean'
  | 'currency'
  | 'date'
  | 'number'
  | 'string';

export type TableBodyCellProps = ComponentPropsWithoutRef<'td'> & {
  columnLabel?: string;
  customStylex?: TableCustomStylex;
  dataType?: TableBodyCellDataType;
  minWidth?: number | string;
  value: unknown;
  width?: number | string;
};
