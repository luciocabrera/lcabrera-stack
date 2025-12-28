import type { ComponentPropsWithoutRef } from 'react';

import type { CustomStylex } from '@/design-system/common.types';

import type { TableColumn } from '../Table.types';

export type TableBodyCellProps = ComponentPropsWithoutRef<'td'> &
  Pick<TableColumn, 'dataType' | 'label' | 'minWidth'> & {
    customStylex?: CustomStylex;
    value: unknown;
    width?: number | string;
  };
