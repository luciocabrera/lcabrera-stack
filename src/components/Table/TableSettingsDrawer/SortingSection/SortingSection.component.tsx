import { useState } from 'react';

import {
  SidePanelSectionMain,
  SidePanelSectionOverlay,
} from '@/components/SidePanel';

import type { SortingSectionProps } from './SortingSection.types';

import { ActiveSortList } from './ActiveSortList';
import { AddSortSection } from './AddSortSection';
import { SortingSectionToolbar } from './SortingSectionToolbar';

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
