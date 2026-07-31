import type { IconProps } from '../Icons.types';

export const RefreshIcon = ({ size = 16, ...props }: IconProps) => (
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
      d='M2 8C2 4.69 4.69 2 8 2C10.21 2 12.1 3.26 13.08 5.08M14 8C14 11.31 11.31 14 8 14C5.79 14 3.9 12.74 2.92 10.92'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
    <path
      d='M13 2V5.08H9.92'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
    <path
      d='M3 14V10.92H6.08'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
  </svg>
);
