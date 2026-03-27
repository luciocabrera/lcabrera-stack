import type { IconProps } from "../Icons.types.ts";

export const MoreVerticalIcon = ({ size = 12, ...props }: IconProps) => (
  <svg
    fill="none"
    height={size}
    viewBox="0 0 12 12"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="6" cy="2" fill="currentColor" r="1" />
    <circle cx="6" cy="6" fill="currentColor" r="1" />
    <circle cx="6" cy="10" fill="currentColor" r="1" />
  </svg>
);
