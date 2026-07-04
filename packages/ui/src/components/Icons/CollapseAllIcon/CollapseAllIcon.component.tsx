import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const CollapseAllIcon = ({ size = 16, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <path d='M11 6h10' />
    <path d='M11 12h10' />
    <path d='M11 18h10' />
    <path d='M3 5l3 3 3-3' />
    <path d='M3 12h6' />
    <path d='M3 19l3-3 3 3' />
  </IconBase>
);
