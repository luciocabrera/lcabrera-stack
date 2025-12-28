import type { ComponentPropsWithoutRef } from 'react';

import type { TableCustomStylex } from '../Table/Table.types';
import type { VirtualizedTableColumn } from '../VirtualizedTable.types';

export type TableHeaderProps = ComponentPropsWithoutRef<'thead'> & {
  columns: VirtualizedTableColumn[];
  customStylex?: TableCustomStylex;
};
