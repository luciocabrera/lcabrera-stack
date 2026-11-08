import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';
import { unsetIconStroke } from '../Icons.constants';

export const ColumnsOrderIcon = ({ size = 16, ...props }: IconProps) => (
  <IconBase size={size} viewBox='0 0 16 16' {...unsetIconStroke} {...props}>
    <rect fill='currentColor' height='6' rx='1' width='3' x='1.5' y='8' />
    <rect fill='currentColor' height='9' rx='1' width='3' x='6.5' y='5' />
    <rect fill='currentColor' height='12' rx='1' width='3' x='11.5' y='2' />
    <path
      d='M2 3L14 3'
      stroke='currentColor'
      strokeLinecap='round'
      strokeWidth='1.5'
    />
    <path
      d='M11.5 1L14 3L11.5 5'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
  </IconBase>
);
