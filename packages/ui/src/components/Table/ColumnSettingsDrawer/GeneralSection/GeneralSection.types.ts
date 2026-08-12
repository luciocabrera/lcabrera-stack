import type { ComponentPropsWithoutRef } from 'react';

import type { DataKey } from '#ui/components/Table/Table.types';

export type GeneralSectionProps<TData> = ComponentPropsWithoutRef<'div'> & {
  readonly columnKey: DataKey<TData>;
  readonly isBusy?: boolean;
};
