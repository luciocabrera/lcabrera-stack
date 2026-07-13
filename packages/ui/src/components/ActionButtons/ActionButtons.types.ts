import type { ButtonProps } from '@repo/ui/components/Button';
import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * Declarative description of one button in an `ActionButtons` group: a
 * required `label` and `onClick`, plus any other `Button` prop (`color`,
 * `size`, `icon`, ...). `color` defaults to `'primary'` and `size` to
 * `'sm'`. `isBusy` is deliberately excluded — busy state applies to the
 * whole group and lives on `ActionButtonsProps`. `key` disambiguates
 * actions whose labels are dynamic or collide; it falls back to `label`.
 */
export type ActionButtonDescriptor = Omit<
  ButtonProps,
  'children' | 'isBusy' | 'onClick'
> & {
  readonly key?: string;
  readonly label: string;
  readonly onClick: NonNullable<ButtonProps['onClick']>;
};

export type ActionButtonsProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> & {
  readonly actions: readonly ActionButtonDescriptor[];
  readonly customStylex?: readonly StyleXStyles[] | StyleXStyles;
  readonly isBusy?: boolean;
};
