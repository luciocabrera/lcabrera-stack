import type { ComponentPropsWithoutRef } from 'react';

import type { SortDirection } from '@/types/ui.types';

export type SortingSectionProps = ComponentPropsWithoutRef<'div'>;

export type SortItem = {
  columnKey: string;
  direction: SortDirection;
  label: string;
};
