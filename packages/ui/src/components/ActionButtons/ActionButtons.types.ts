import type { ButtonProps } from '@repo/ui/components/Button';
import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * Declarative description of one button in an `ActionButtons` group: a
 * required `label`, plus any other `Button` prop (`variant`, `size`,
 * `icon`, `onClick`, ...). `color` defaults to `'primary'` and `size`
 * to `'sm'`. `isBusy` is deliberately excluded — busy state applies to
 * the whole group and lives on `ActionButtonsProps`. `key`
 * disambiguates actions whose labels are dynamic or collide; it falls
 * back to `label`.
 */
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
