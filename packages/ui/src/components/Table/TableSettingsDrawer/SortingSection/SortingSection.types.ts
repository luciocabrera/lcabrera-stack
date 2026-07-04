import type { ComponentPropsWithoutRef } from 'react';

import type { SortDirection } from '@repo/ui/types/ui.types';

export type SortingSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};

export type SortItem = {
  readonly columnKey: string;
  readonly direction: SortDirection;
  readonly label: string;
};
