import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const GroupRowsIcon = ({ size = 16, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <path d='M3 5h18' />
    <path d='M7 10h14' />
    <path d='M7 14h14' />
    <path d='M3 19h18' />
    <path d='M3 5v14' />
  </IconBase>
);
