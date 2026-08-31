import type { IconProps } from '../Icons.types';

export const ListOrderedIcon = ({ size = 16, ...props }: IconProps) => (
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
      d='M6 3.5H14M6 8H14M6 12.5H14'
      stroke='currentColor'
      strokeLinecap='round'
      strokeWidth='1.5'
    />
    <text
      fill='currentColor'
      fontSize='5'
      fontWeight='bold'
      textAnchor='middle'
      x='3'
      y='5.5'
    >
      1
    </text>
    <text
      fill='currentColor'
      fontSize='5'
      fontWeight='bold'
      textAnchor='middle'
      x='3'
      y='10'
    >
      2
    </text>
    <text
      fill='currentColor'
      fontSize='5'
      fontWeight='bold'
      textAnchor='middle'
      x='3'
      y='14.5'
    >
      3
    </text>
  </svg>
);
