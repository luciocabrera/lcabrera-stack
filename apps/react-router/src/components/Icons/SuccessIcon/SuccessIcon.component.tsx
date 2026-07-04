import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const SuccessIcon = ({ size = 24, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <circle cx='12' cy='12' r='10' />
    <path d='m9 12 2 2 4-4' />
  </IconBase>
);
