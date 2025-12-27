import type { ComponentPropsWithoutRef } from 'react';

import type { TableCustomStylex } from '../Table/Table.types';

export type TableRowProps = ComponentPropsWithoutRef<'div'> & {
  customStylex?: TableCustomStylex;
  isHeader?: boolean;
  isStriped?: boolean;
  virtualizedStyle?: {
    height: number;
    top: number;
  };
};
