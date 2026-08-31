import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

import type { ButtonProps } from '#ui/components/Button';

export type ActionButtonDescriptor = Omit<
  ButtonProps,
  'children' | 'isBusy'
> & {
  readonly key?: string;
  readonly label: string;
};

export type ActionButtonsProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> & {
  readonly actions: readonly ActionButtonDescriptor[];
  readonly customStylex?: readonly StyleXStyles[] | StyleXStyles;
  readonly isBusy?: boolean;
};
