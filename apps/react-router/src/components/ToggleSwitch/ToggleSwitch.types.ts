import type { ComponentPropsWithoutRef } from 'react';

/**
 * ToggleSwitch component props
 */
export type ToggleSwitchProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'onChange' | 'type'
> & {
  /** Whether loading shimmer should be shown */
  readonly isBusy?: boolean;
  /** Backward-compatible alias for isBusy */
  readonly isBussy?: boolean;
  /** Whether the toggle is checked */
  readonly isChecked: boolean;
  /** Whether the toggle is disabled */
  readonly isDisabled?: boolean;
  /** Label text for the toggle */
  readonly label?: string;
  /** Callback when toggle state changes */
  readonly onChange: (isChecked: boolean) => void;
};
