import { useState } from "react";

import { SidePanelSectionMain, SidePanelSectionOverlay } from "@/components/SidePanel";

import type { SortingSectionProps } from "./SortingSection.types.ts";

import { ActiveSortList } from "./ActiveSortList/index.ts";
import { AddSortSection } from "./AddSortSection/index.ts";
import { SortingSectionToolbar } from "./SortingSectionToolbar/index.ts";

export const SortingSection = ({ ...props }: SortingSectionProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <SidePanelSectionMain {...props}>
      <AddSortSection onDropdownOpenChange={setIsDropdownOpen} />

      <SidePanelSectionOverlay isOpen={isDropdownOpen}>
        <ActiveSortList />
        <SortingSectionToolbar />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
