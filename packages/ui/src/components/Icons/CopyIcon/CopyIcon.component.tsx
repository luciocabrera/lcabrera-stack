import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const CopyIcon = ({ size = 24, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <rect height='13' rx='2' width='13' x='9' y='9' />
    <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
  </IconBase>
);
