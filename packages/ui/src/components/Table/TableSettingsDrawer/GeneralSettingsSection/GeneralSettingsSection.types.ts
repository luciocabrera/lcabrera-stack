import type { ComponentPropsWithoutRef } from 'react';

export type GeneralSettingsSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};
