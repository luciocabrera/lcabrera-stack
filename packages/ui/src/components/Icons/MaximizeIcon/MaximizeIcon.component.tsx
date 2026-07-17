import type { IconProps } from '../Icons.types';

export const MaximizeIcon = ({ size = 16, ...props }: IconProps) => (
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
      d='M6 2L2 6M2 6H6M2 6V2M10 14L14 10M14 10H10M14 10V14'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
  </svg>
);
