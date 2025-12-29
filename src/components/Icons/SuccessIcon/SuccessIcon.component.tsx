import type { IconProps } from '../Icons.types';

export const SuccessIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2'
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <circle cx='12' cy='12' r='10' />
    <path d='m9 12 2 2 4-4' />
  </svg>
);
