import type { ComponentPropsWithoutRef } from 'react';

/**
 * GeneralSettingsSection component props
 */
export type GeneralSettingsSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};
/**
 * Width preset options for column sizing
 */
export type WidthPreset = 'default' | 'max' | 'min' | undefined;
