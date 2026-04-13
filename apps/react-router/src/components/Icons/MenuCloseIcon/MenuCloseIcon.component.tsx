import type { IconProps } from '../Icons.types.ts';

export const MenuCloseIcon = ({ size = 24, ...props }: IconProps) => (
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
    <path d='M18 6 6 18' />
    <path d='m6 6 12 12' />
  </svg>
);
