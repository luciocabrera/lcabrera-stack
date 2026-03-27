import type { IconProps } from "../Icons.types.ts";

export const ColumnsOrderIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    fill="none"
    height={size}
    viewBox="0 0 16 16"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Three vertical columns with ascending height representing column ordering */}
    <rect fill="currentColor" height="6" rx="1" width="3" x="1.5" y="8" />
    <rect fill="currentColor" height="9" rx="1" width="3" x="6.5" y="5" />
    <rect fill="currentColor" height="12" rx="1" width="3" x="11.5" y="2" />
    {/* Arrow pointing right to show ordering direction */}
    <path d="M2 3L14 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    <path
      d="M11.5 1L14 3L11.5 5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);
