import {
  SidePanelSectionMain,
  SidePanelSectionOverlay,
} from '@repo/ui/components/SidePanel';
import { useState } from 'react';

import type { SortingSectionProps } from './SortingSection.types';

import { ActiveSortList } from './ActiveSortList';
import { AddSortSection } from './AddSortSection';
import { SortingSectionToolbar } from './SortingSectionToolbar';

export const SortingSection = ({ isBusy = false }: SortingSectionProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <SidePanelSectionMain>
      <AddSortSection
        isBusy={isBusy}
        onDropdownOpenChange={setIsDropdownOpen}
      />

      <SidePanelSectionOverlay isOpen={isDropdownOpen}>
        <ActiveSortList isBusy={isBusy} />
        <SortingSectionToolbar isBusy={isBusy} />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
