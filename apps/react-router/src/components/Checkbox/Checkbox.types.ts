import type { ChangeEventHandler, ComponentPropsWithoutRef } from 'react';

export type CheckboxProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'checked' | 'disabled' | 'onChange' | 'readOnly' | 'type'
> & {
  readonly dataTestId?: string;
  readonly isChecked: boolean;
  readonly isDisabled?: boolean;
  readonly isReadOnly?: boolean;
  readonly onChange?: ChangeEventHandler<HTMLInputElement>;
};
