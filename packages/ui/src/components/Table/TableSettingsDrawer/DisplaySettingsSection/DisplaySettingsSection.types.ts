import type { ComponentPropsWithoutRef } from 'react';

export type DisplaySettingsSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};
