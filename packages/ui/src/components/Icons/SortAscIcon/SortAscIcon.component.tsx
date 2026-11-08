import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';
import { unsetIconStroke } from '../Icons.constants';

export const SortAscIcon = ({ size = 12, ...props }: IconProps) => (
  <IconBase size={size} viewBox='0 0 12 12' {...unsetIconStroke} {...props}>
    <path d='M6 3L10 8H2L6 3Z' fill='currentColor' />
  </IconBase>
);
