import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';
import { unsetIconStroke } from '../Icons.constants';

export const CheckIcon = ({ size = 10, ...props }: IconProps) => (
  <IconBase size={size} viewBox='0 0 10 10' {...unsetIconStroke} {...props}>
    <path
      d='M1.5 5.5L4 8L8.5 2'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
  </IconBase>
);
