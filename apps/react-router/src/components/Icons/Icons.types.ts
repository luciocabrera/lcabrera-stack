import type { ComponentProps } from 'react';

export type IconProps = ComponentProps<'svg'> & {
  readonly size?: number;
};
