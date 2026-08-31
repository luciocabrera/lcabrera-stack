import type { IconProps } from '../Icons.types';

export const IconBase = ({ size = 24, ...props }: IconProps) => (
  <svg
    aria-hidden='true'
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
  />
);
