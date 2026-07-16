import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const ExpandAllIcon = ({ size = 16, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <path d='M11 6h10' />
    <path d='M11 12h10' />
    <path d='M11 18h10' />
    <path d='M3 4l3 3 3-3' />
    <path d='M3 10l3 3 3-3' />
    <path d='M3 16l3 3 3-3' />
  </IconBase>
);
