import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

export const DisclosureIcon = ({ size = 24, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <polyline points='9 6 15 12 9 18' />
  </IconBase>
);
