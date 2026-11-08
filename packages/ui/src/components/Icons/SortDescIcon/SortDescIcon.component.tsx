import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';
import { unsetIconStroke } from '../Icons.constants';

export const SortDescIcon = ({ size = 12, ...props }: IconProps) => (
  <IconBase size={size} viewBox='0 0 12 12' {...unsetIconStroke} {...props}>
    <path d='M6 9L2 4H10L6 9Z' fill='currentColor' />
  </IconBase>
);
