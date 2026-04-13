import type { IconProps } from '../Icons.types.ts';

export const LockIcon = ({ size = 24, ...props }: IconProps) => (
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
    <rect height='11' rx='2' ry='2' width='18' x='3' y='11' />
    <path d='M7 11V7a5 5 0 0 1 10 0v4' />
  </svg>
);
