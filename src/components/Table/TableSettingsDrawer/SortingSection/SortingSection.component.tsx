import { useState } from 'react';

import {
  SidePanelSectionMain,
  SidePanelSectionOverlay,
} from '@/components/SidePanel';

import type { SortingSectionProps } from './SortingSection.types';

import { ActiveSortList } from './ActiveSortList';
import { AddSortSection } from './AddSortSection';
import { SortingSectionFooter } from './SortingSectionFooter';

export const SortingSection = ({ ...props }: SortingSectionProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <SidePanelSectionMain {...props}>
      <AddSortSection onDropdownOpenChange={setIsDropdownOpen} />

      <SidePanelSectionOverlay isOpen={isDropdownOpen}>
        <ActiveSortList />
        <SortingSectionFooter />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
