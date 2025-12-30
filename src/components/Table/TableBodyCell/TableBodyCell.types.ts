import type { ComponentPropsWithoutRef } from 'react';

import type { CustomStylex } from '@/types/design-system.types';

import type { TableColumn } from '../Table.types';

export type TableBodyCellProps = ComponentPropsWithoutRef<'td'> &
  Pick<TableColumn, 'dataType' | 'format' | 'label' | 'minWidth'> & {
    customStylex?: CustomStylex;
    /** Locale for formatting */
    locale?: string;
    value: unknown;
    width?: number | string;
  };
