import type { ComponentPropsWithoutRef } from 'react';

import type { TableCustomStylex } from '../TableBase/TableBase.types';

export type TableRowProps = ComponentPropsWithoutRef<'div'> & {
  customStylex?: TableCustomStylex;
  isHeader?: boolean;
  isStriped?: boolean;
  virtualizedStyle?: {
    height: number;
    top: number;
  };
};
