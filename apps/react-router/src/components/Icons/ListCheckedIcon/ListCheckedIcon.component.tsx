import type { IconProps } from '../Icons.types';

export const ListCheckedIcon = ({ size = 16, ...props }: IconProps) => (
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
    <path d='M10 6h11' />
    <path d='M10 12h11' />
    <path d='M10 18h11' />
    <path d='M3 6l2 2 4-4' />
    <path d='M3 12l2 2 4-4' />
    <path d='M3 18l2 2 4-4' />
  </svg>
);
