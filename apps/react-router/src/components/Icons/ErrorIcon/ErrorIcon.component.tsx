import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const ErrorIcon = ({ size = 24, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <circle cx='12' cy='12' r='10' />
    <path d='m15 9-6 6' />
    <path d='m9 9 6 6' />
  </IconBase>
);
