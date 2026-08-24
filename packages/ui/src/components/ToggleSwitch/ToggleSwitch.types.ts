import type { ComponentPropsWithoutRef } from 'react';

export type ToggleSwitchProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'onChange' | 'type'
> & {
  readonly isBusy?: boolean;
  readonly isChecked: boolean;
  readonly isDisabled?: boolean;
  readonly label?: string;
  readonly onChange: (isChecked: boolean) => void;
};
