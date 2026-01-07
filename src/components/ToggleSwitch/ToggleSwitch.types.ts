import type { ComponentPropsWithoutRef } from 'react';

/**
 * ToggleSwitch component props
 */
export type ToggleSwitchProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'onChange' | 'type'
> & {
  /** Whether the toggle is checked */
  isChecked: boolean;
  /** Whether the toggle is disabled */
  isDisabled?: boolean;
  /** Label text for the toggle */
  label?: string;
  /** Callback when toggle state changes */
  onChange: (isChecked: boolean) => void;
};
