import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';
import { unsetIconStroke } from '../Icons.constants';

export const FilterIcon = ({ size = 16, ...props }: IconProps) => (
  <IconBase size={size} viewBox='0 0 16 16' {...unsetIconStroke} {...props}>
    <path
      d='M2 4H14M4 8H12M6 12H10'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
  </IconBase>
);
