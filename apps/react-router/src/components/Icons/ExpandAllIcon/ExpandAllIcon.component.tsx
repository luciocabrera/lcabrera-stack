import type { IconProps } from '../Icons.types';

export const ExpandAllIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    fill='none'
    height={size}
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2'
    viewBox='0 0 24 24'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path d='M11 6h10' />
    <path d='M11 12h10' />
    <path d='M11 18h10' />
    <path d='M3 4l3 3 3-3' />
    <path d='M3 10l3 3 3-3' />
    <path d='M3 16l3 3 3-3' />
  </svg>
);
