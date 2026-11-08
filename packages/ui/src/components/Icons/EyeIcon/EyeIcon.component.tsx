import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const EyeIcon = ({ size = 24, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
    <circle cx='12' cy='12' r='3' />
  </IconBase>
);
