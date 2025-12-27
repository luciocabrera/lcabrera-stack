import type { ComponentPropsWithoutRef } from 'react';

import type { TableCustomStylex } from '../Table/Table.types';

export type TableBodyCellDataType = 'boolean' | 'currency' | 'date' | 'number' | 'string';

export type TableBodyCellProps = ComponentPropsWithoutRef<'td'> & {
  customStylex?: TableCustomStylex;
  dataType?: TableBodyCellDataType;
  minWidth?: number | string;
  value: unknown;
  width?: number | string;
};
