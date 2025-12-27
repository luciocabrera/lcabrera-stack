import type { ComponentPropsWithoutRef } from 'react';

import type { TableCustomStylex } from '../Table/Table.types';

export type TableCellProps = ComponentPropsWithoutRef<'div'> & {
  align?: 'center' | 'left' | 'right';
  customStylex?: TableCustomStylex;
  isHeader?: boolean;
  isSticky?: boolean;
  minWidth?: number | string;
  width?: number | string;
};
