import type { IconProps } from '../Icons.types';

export const SortNeutralIcon = (props: IconProps) => (
  <svg
    fill="none"
    height="12"
    viewBox="0 0 12 12"
    width="12"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M6 2L9 5H3L6 2Z" fill="currentColor" opacity="0.5" />
    <path d="M6 10L3 7H9L6 10Z" fill="currentColor" opacity="0.5" />
  </svg>
);
