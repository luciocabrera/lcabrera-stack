import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const MenuCloseIcon = ({ size = 24, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <path d='M18 6 6 18' />
    <path d='m6 6 12 12' />
  </IconBase>
);
