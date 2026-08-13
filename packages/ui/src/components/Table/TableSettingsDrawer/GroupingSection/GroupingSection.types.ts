import type { ComponentPropsWithoutRef } from 'react';

export type GroupingSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};

/** One applied group key, as the drawer list renders it. */
export type GroupKeyItem = {
  readonly columnKey: string;
  readonly label: string;
};
