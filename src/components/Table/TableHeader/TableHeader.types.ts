import type { ComponentPropsWithoutRef } from 'react';

import type { TableColumn } from '../Table.types';
import type { TableCustomStylex } from '../TableBase/TableBase.types';

export type TableHeaderProps = ComponentPropsWithoutRef<'thead'> & {
  columns: TableColumn[];
  customStylex?: TableCustomStylex;
};
