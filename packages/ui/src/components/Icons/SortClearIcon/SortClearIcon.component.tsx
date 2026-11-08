import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';
import { unsetIconStroke } from '../Icons.constants';

export const SortClearIcon = ({ size = 12, ...props }: IconProps) => (
  <IconBase size={size} viewBox='0 0 12 12' {...unsetIconStroke} {...props}>
    <path d='M6 2L9 5H3L6 2Z' fill='currentColor' opacity='0.3' />
    <path d='M6 10L3 7H9L6 10Z' fill='currentColor' opacity='0.3' />
    <line
      stroke='currentColor'
      strokeLinecap='round'
      strokeWidth='1.5'
      x1='2.5'
      x2='9.5'
      y1='9.5'
      y2='2.5'
    />
  </IconBase>
);
