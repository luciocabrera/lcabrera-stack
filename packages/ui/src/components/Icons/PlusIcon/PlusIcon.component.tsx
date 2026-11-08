import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const PlusIcon = ({ size = 24, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <line x1='12' x2='12' y1='5' y2='19' />
    <line x1='5' x2='19' y1='12' y2='12' />
  </IconBase>
);
