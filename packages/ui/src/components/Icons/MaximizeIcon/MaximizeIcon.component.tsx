import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';
import { unsetIconStroke } from '../Icons.constants';

export const MaximizeIcon = ({ size = 16, ...props }: IconProps) => (
  <IconBase size={size} viewBox='0 0 16 16' {...unsetIconStroke} {...props}>
    <path
      d='M6 2L2 6M2 6H6M2 6V2M10 14L14 10M14 10H10M14 10V14'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
  </IconBase>
);
