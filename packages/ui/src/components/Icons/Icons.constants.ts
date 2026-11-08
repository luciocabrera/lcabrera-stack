import type { IconProps } from './Icons.types';

export const unsetIconStroke = {
  stroke: undefined,
  strokeLinecap: undefined,
  strokeLinejoin: undefined,
  strokeWidth: undefined,
} as const satisfies IconProps;
