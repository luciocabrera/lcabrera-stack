import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const ListUncheckedIcon = ({ size = 16, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <path d='M10 6h11' />
    <path d='M10 12h11' />
    <path d='M10 18h11' />
    <rect height='5' rx='1' width='5' x='3' y='3.5' />
    <rect height='5' rx='1' width='5' x='3' y='9.5' />
    <rect height='5' rx='1' width='5' x='3' y='15.5' />
  </IconBase>
);
