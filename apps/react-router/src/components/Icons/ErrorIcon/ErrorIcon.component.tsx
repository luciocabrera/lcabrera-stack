import type { IconProps } from '../Icons.types.ts';

export const ErrorIcon = ({ size = 24, ...props }: IconProps) => (
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
    <circle cx='12' cy='12' r='10' />
    <path d='m15 9-6 6' />
    <path d='m9 9 6 6' />
  </svg>
);
