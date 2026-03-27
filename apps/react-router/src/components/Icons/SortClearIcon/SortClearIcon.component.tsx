import type { IconProps } from "../Icons.types.ts";

export const SortClearIcon = ({ size = 12, ...props }: IconProps) => (
  <svg
    fill="none"
    height={size}
    viewBox="0 0 12 12"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Up arrow (faded) */}
    <path d="M6 2L9 5H3L6 2Z" fill="currentColor" opacity="0.3" />
    {/* Down arrow (faded) */}
    <path d="M6 10L3 7H9L6 10Z" fill="currentColor" opacity="0.3" />
    {/* Diagonal strikethrough */}
    <line
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
      x1="2.5"
      x2="9.5"
      y1="9.5"
      y2="2.5"
    />
  </svg>
);
