import type { IconProps } from "../Icons.types.ts";

export const RefreshIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    fill="none"
    height={size}
    viewBox="0 0 16 16"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M2 8C2 4.68629 4.68629 2 8 2C10.2091 2 12.1046 3.26429 13.0834 5.08333M14 8C14 11.3137 11.3137 14 8 14C5.79086 14 3.89543 12.7357 2.91667 10.9167"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M13 2V5.08333H9.91667"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M3 14V10.9167H6.08333"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);
