import type { IconProps } from '../Icons.types.ts';

export const InfoIcon = ({ size = 24, ...props }: IconProps) => (
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
    <circle cx='12' cy='12' r='10' />
    <path d='M12 16v-4' />
    <path d='M12 8h.01' />
  </svg>
);
