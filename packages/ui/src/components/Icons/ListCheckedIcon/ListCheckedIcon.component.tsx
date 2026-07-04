import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const ListCheckedIcon = ({ size = 16, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <path d='M10 6h11' />
    <path d='M10 12h11' />
    <path d='M10 18h11' />
    <path d='M3 6l2 2 4-4' />
    <path d='M3 12l2 2 4-4' />
    <path d='M3 18l2 2 4-4' />
  </IconBase>
);
