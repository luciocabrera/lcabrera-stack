import type { IconProps } from '../Icons.types';

export const CheckIcon = (props: IconProps) => (
  <svg
    fill='none'
    height='10'
    viewBox='0 0 10 10'
    width='10'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M1.5 5.5L4 8L8.5 2'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
  </svg>
);
