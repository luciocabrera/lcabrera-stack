import type { IconProps } from '../Icons.types';

export const FilterIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    aria-hidden='true'
    fill='none'
    height={size}
    viewBox='0 0 16 16'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M2 4H14M4 8H12M6 12H10'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
  </svg>
);
