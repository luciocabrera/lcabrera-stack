import type { IconProps } from '../Icons.types.ts';

export const EraserIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    fill='none'
    height={size}
    viewBox='0 0 16 16'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M11.5 3.5L12.5 2.5C13.0523 1.94772 13.9477 1.94772 14.5 2.5V2.5C15.0523 3.05228 15.0523 3.94772 14.5 4.5L13.5 5.5M11.5 3.5L5.5 9.5L3 12L1.5 14.5H6L7.5 12L13.5 5.5M11.5 3.5L13.5 5.5'
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
