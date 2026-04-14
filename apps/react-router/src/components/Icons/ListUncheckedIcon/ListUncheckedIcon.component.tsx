import type { IconProps } from '../Icons.types';

export const ListUncheckedIcon = ({ size = 16, ...props }: IconProps) => (
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
    <rect height='5' rx='1' width='5' x='3' y='3.5' />
    <rect height='5' rx='1' width='5' x='3' y='9.5' />
    <rect height='5' rx='1' width='5' x='3' y='15.5' />
  </svg>
);
