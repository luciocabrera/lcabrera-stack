import { useState } from 'react';

import {
  SidePanelSectionMain,
  SidePanelSectionOverlay,
} from '#ui/components/SidePanel';

import type { GroupKeysSubsectionProps } from './GroupKeysSubsection.types';

import { ActiveGroupKeyList } from '../ActiveGroupKeyList';
import { AddGroupKeySection } from '../AddGroupKeySection';

export const GroupKeysSubsection = ({
  isBusy = false,
}: GroupKeysSubsectionProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <SidePanelSectionMain>
      <AddGroupKeySection
        isBusy={isBusy}
        onDropdownOpenChange={setIsDropdownOpen}
      />

      <SidePanelSectionOverlay isOpen={isDropdownOpen}>
        <ActiveGroupKeyList isBusy={isBusy} />
      </SidePanelSectionOverlay>
    </SidePanelSectionMain>
  );
};
