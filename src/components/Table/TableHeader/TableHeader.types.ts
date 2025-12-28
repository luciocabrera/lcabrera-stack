import type { ComponentPropsWithoutRef } from 'react';

import type { VirtualizedTableColumn } from '../Table.types';
import type { TableCustomStylex } from '../TableBase/TableBase.types';

export type TableHeaderProps = ComponentPropsWithoutRef<'thead'> & {
  columns: VirtualizedTableColumn[];
  customStylex?: TableCustomStylex;
};
