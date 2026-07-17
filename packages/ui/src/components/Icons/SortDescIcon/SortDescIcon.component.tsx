import type { IconProps } from '../Icons.types';

export const SortDescIcon = ({ size = 12, ...props }: IconProps) => (
  <svg
    aria-hidden='true'
    fill='none'
    height={size}
    viewBox='0 0 12 12'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path d='M6 9L2 4H10L6 9Z' fill='currentColor' />
  </svg>
);
