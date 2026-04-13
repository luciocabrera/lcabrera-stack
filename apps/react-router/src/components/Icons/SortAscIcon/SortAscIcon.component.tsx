import type { IconProps } from '../Icons.types.ts';

export const SortAscIcon = ({ size = 12, ...props }: IconProps) => (
  <svg
    fill='none'
    height={size}
    viewBox='0 0 12 12'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path d='M6 3L10 8H2L6 3Z' fill='currentColor' />
  </svg>
);
