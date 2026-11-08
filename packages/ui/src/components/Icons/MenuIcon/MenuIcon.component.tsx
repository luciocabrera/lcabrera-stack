import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const MenuIcon = ({ size = 24, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <line x1='4' x2='20' y1='12' y2='12' />
    <line x1='4' x2='20' y1='6' y2='6' />
    <line x1='4' x2='20' y1='18' y2='18' />
  </IconBase>
);
