import type { IconProps } from '../Icons.types';

export const EraserIcon = ({ size = 16, ...props }: IconProps) => (
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
      d='M11.5 3.5L12.5 2.5C13.05 1.95 13.95 1.95 14.5 2.5V2.5C15.05 3.05 15.05 3.95 14.5 4.5L13.5 5.5M11.5 3.5L5.5 9.5L3 12L1.5 14.5H6L7.5 12L13.5 5.5M11.5 3.5L13.5 5.5'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
    <path
      d='M5.5 9.5L7.5 11.5'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
  </svg>
);
