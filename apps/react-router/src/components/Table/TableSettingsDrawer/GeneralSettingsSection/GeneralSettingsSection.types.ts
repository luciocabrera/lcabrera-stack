import type { ComponentPropsWithoutRef } from 'react';

/**
 * GeneralSettingsSection component props
 */
export type GeneralSettingsSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};
