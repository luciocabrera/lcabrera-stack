import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';
import { unsetIconStroke } from '../Icons.constants';

export const SortNeutralIcon = ({ size = 12, ...props }: IconProps) => (
  <IconBase size={size} viewBox='0 0 12 12' {...unsetIconStroke} {...props}>
    <path d='M6 2L9 5H3L6 2Z' fill='currentColor' opacity='0.5' />
    <path d='M6 10L3 7H9L6 10Z' fill='currentColor' opacity='0.5' />
  </IconBase>
);
