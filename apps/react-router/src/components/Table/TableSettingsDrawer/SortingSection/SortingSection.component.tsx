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
  const isBussy = props.isBussy ?? false;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <SidePanelSectionMain {...props}>
      <AddSortSection
        isBussy={isBussy}
        onDropdownOpenChange={setIsDropdownOpen}
      />

      <SidePanelSectionOverlay isOpen={isDropdownOpen}>
        <ActiveSortList isBussy={isBussy} />
        <SortingSectionToolbar isBussy={isBussy} />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
