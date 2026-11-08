import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const EyeOffIcon = ({ size = 24, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <path d='M9.88 9.88a3 3 0 1 0 4.24 4.24' />
    <path d='M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 7 11 7a13.16 13.16 0 0 1-1.67 2.68' />
    <path d='M6.61 6.61A13.526 13.526 0 0 0 1 12s4 7 11 7a9.74 9.74 0 0 0 5.39-1.61' />
    <path d='M2 2l20 20' />
  </IconBase>
);
