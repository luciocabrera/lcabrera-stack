import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const InfoIcon = ({ size = 24, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <circle cx='12' cy='12' r='10' />
    <path d='M12 16v-4' />
    <path d='M12 8h.01' />
  </IconBase>
);
