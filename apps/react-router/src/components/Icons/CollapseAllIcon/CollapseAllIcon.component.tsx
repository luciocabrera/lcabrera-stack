import type { IconProps } from '../Icons.types';

export const CollapseAllIcon = ({ size = 16, ...props }: IconProps) => (
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
    <path d='M4 4l3 2-3 2' />
    <path d='M4 10l3 2-3 2' />
    <path d='M4 16l3 2-3 2' />
  </svg>
);
