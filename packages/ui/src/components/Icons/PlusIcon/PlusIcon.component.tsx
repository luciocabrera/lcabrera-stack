import type { IconProps } from '../Icons.types';

export const PlusIcon = ({ size = 24, ...props }: IconProps) => (
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
    <line x1='12' x2='12' y1='5' y2='19' />
    <line x1='5' x2='19' y1='12' y2='12' />
  </svg>
);
