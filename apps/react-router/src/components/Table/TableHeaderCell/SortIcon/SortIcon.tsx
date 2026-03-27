import { SortAscIcon, SortDescIcon, SortNeutralIcon } from "@/components/Icons";

import type { SortIconProps } from "./SortIcon.types.ts";

export const SortIcon = ({ direction }: SortIconProps) => {
  if (direction === "asc") {
    return <SortAscIcon size={14} />;
  }
  if (direction === "desc") {
    return <SortDescIcon size={14} />;
  }
  return <SortNeutralIcon size={14} />;
};
