import type { IconProps } from "../Icons.types.ts";

export const MinimizeIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    fill="none"
    height={size}
    viewBox="0 0 16 16"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M10 6L14 2M14 2H10M14 2V6M6 10L2 14M2 14H6M2 14L2 10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);
