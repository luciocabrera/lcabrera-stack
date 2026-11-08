import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';
import { unsetIconStroke } from '../Icons.constants';

export const MoreVerticalIcon = ({ size = 12, ...props }: IconProps) => (
  <IconBase size={size} viewBox='0 0 12 12' {...unsetIconStroke} {...props}>
    <circle cx='6' cy='2' fill='currentColor' r='1' />
    <circle cx='6' cy='6' fill='currentColor' r='1' />
    <circle cx='6' cy='10' fill='currentColor' r='1' />
  </IconBase>
);
