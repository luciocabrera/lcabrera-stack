import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';
import type { ComponentPropsWithoutRef } from 'react';

export type GeneralSectionProps<TData> = ComponentPropsWithoutRef<'div'> & {
  readonly columnKey: DataKey<TData>;
  readonly isBusy?: boolean;
};
