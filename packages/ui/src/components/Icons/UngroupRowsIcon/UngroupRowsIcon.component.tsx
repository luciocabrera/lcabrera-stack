import type { IconProps } from '../Icons.types';

import { IconBase } from '../IconBase';

/** The grouped-rows glyph struck through — the "clear grouping" affordance. */
export const UngroupRowsIcon = ({ size = 16, ...props }: IconProps) => (
  <IconBase size={size} {...props}>
    <path d='M3 5h18' />
    <path d='M7 10h14' />
    <path d='M7 14h14' />
    <path d='M3 19h18' />
    <path d='M3 5v14' />
    <path d='M20 4L4 20' />
  </IconBase>
);
